import { Construct } from 'constructs';
import { CustomResource, PhysicalName, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec from 'aws-cdk-lib/aws-elasticache';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

interface RedisBaseStackProps extends StackProps {
  vpc: ec2.Vpc;
  eksCluster: eks.Cluster;
}

export class RedisBaseStack extends Stack {
    public readonly redisSecurityGroup: ec2.SecurityGroup;
    public readonly redisSubnetGroup: ec.CfnSubnetGroup;
    public readonly redisPassword: sm.Secret;
    public readonly powerRedisUser: ec.CfnUser;
    public readonly userGroup: ec.CfnUserGroup;

    constructor(scope: Construct, id: string, props: RedisBaseStackProps) {
    super(scope, id, props);

    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Redis ElastiCache',
      allowAllOutbound: true,
    });

    this.redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcpRange(6379, 6380),
      'Allow Redis access from within VPC'
    );

    this.redisSubnetGroup = new ec.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis ElastiCache',
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const defaultUserId = "default";
    const powerUserId = "sequencer-power-user";

    this.redisPassword = new sm.Secret(this, 'RedisPassword', {
      generateSecretString: {
        excludeCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?/',
        passwordLength: 20,
        excludePunctuation: true,
        excludeUppercase: false,
        excludeLowercase: false,
        excludeNumbers: false,
        includeSpace: false
      },
    });
   
    this.powerRedisUser = new ec.CfnUser(this, 'PowerRedisUser', {
        userId: powerUserId,
        userName: powerUserId,
        accessString: 'on ~* +@all',
        engine: 'redis',
        passwords: ["placeholder-password-to-be-changed"]
    });

    // Create a Lambda function to set the password
    const setPasswordFunction = new lambda.Function(this, 'SetPasswordFunction', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('./lambda'),
        initialPolicy: [
          new iam.PolicyStatement({
            actions: [
              'elasticache:ModifyUser',
              'secretsmanager:GetSecretValue',
            ],
            resources: ['*'],
          }),
        ],
    });
  
    // Create a custom resource provider
    const provider = new cr.Provider(this, 'SetPasswordProvider', {
        onEventHandler: setPasswordFunction,
    });
  
    // Create a custom resource to set the user password securely
    const setPasswordCustomResource = new CustomResource(this, 'SetRedisPassword', {
        serviceToken: provider.serviceToken,
        properties: {
          //UserID: powerUserId,
          DefaultUserID: defaultUserId,
          CustomUserID: powerUserId,
          SecretARN: this.redisPassword.secretArn,
        },
    });
    // Ensure the custom resource runs after the user is created
    setPasswordCustomResource.node.addDependency(this.powerRedisUser);
    
    this.userGroup = new ec.CfnUserGroup(this, 'PowerUserGroup', {
        engine: 'redis',
        userGroupId: 'power-group',
        userIds: [defaultUserId, this.powerRedisUser.userId],
    });
    this.userGroup.addDependency(this.powerRedisUser);

    // Grant access to the Redis cluster from the EKS cluster
    props.eksCluster.addManifest('RedisServiceAccount', {
        apiVersion: 'v1',
        kind: 'ServiceAccount',
        metadata: {
          name: 'redis-service-account',
          namespace: 'default',
        },
      });
    }
}
