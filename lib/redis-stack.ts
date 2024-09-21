import { Construct } from 'constructs';
import { CfnDeletionPolicy, CfnOutput, CfnResource, CustomResource, CustomResourceProvider, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec from 'aws-cdk-lib/aws-elasticache';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

interface RedisStackProps extends StackProps {
  vpc: ec2.Vpc;
  eksCluster: eks.Cluster;
}

export class RedisStack extends Stack {
  constructor(scope: Construct, id: string, props: RedisStackProps) {
    super(scope, id, props);

    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Redis ElastiCache',
      allowAllOutbound: true,
    });

    redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcpRange(6379, 6380),
      'Allow Redis access from within VPC'
    );

    const redisSubnetGroup = new ec.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis ElastiCache',
      subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const defaultUserId = "default";
    const powerUserId = "sequencer-power-user";

    const redisPassword = new sm.Secret(this, 'RedisPassword', {
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
   
    const powerRedisUser = new ec.CfnUser(this, 'PowerRedisUser', {
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
          SecretARN: redisPassword.secretArn,
        },
    });
    // Ensure the custom resource runs after the user is created
    setPasswordCustomResource.node.addDependency(powerRedisUser);
    
    const userGroup = new ec.CfnUserGroup(this, 'PowerUserGroup', {
        engine: 'redis',
        userGroupId: 'power-group',
        userIds: [defaultUserId, powerRedisUser.userId],
    });
    userGroup.addDependency(powerRedisUser);

    const redis = new ec.CfnServerlessCache(this, 'RedisCluster', {
      engine: 'redis',
      serverlessCacheName: 'sequencer-redis',
      majorEngineVersion: '7',
      subnetIds: redisSubnetGroup.subnetIds,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      userGroupId: userGroup.userGroupId,
      cacheUsageLimits: {
        dataStorage: {
          maximum: 1,
          unit: 'GB',
        },
        ecpuPerSecond: {
          maximum: 1000,
        },
      },
    });
    redis.addDependency(userGroup);

    // Grant access to the Redis cluster from the EKS cluster
    props.eksCluster.addManifest('RedisServiceAccount', {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: 'redis-service-account',
        namespace: 'default',
      },
    });

    new CfnOutput(this, 'RedisCacheName', {
        value: redis.serverlessCacheName,
        description: 'Redis CacheName',
    });
    new CfnOutput(this, 'RedisEndpoint', {
      value: redis.attrEndpointAddress,
      description: 'Redis Endpoint',
    });
    new CfnOutput(this, 'RedisPort', {
        value: redis.attrEndpointPort,
        description: 'Redis Port',
    });
    new CfnOutput(this, 'RedisUser', {
        value: powerRedisUser.userId,
        description: 'Redis User',
    });
    new CfnOutput(this, 'RedisPasswordSecretName', {
        value: redisPassword.secretName ?? "",
        description: 'Redis Password SecretName',
    });
  }
}