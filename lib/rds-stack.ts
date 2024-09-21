import { Construct } from 'constructs';
import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';

interface RdsStackProps extends StackProps {
  vpc: ec2.Vpc;
  eksCluster: eks.Cluster;
}

export class RdsStack extends Stack {
  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    // TODO: rds-monitoring-role Policy:AmazonRDSEnhancedMonitoringRole

    /*
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
    */

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS Aurora Serverless',
      allowAllOutbound: true,
    });

    rdsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    const databaseCredentials = new sm.Secret(this, 'DBCredentials', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'sequencer' }),
        excludeCharacters: '/@"',
        generateStringKey: 'password',
      },
    });

    const rdsCluster = new rds.ServerlessCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', 'default.aurora-postgresql10'),
      vpc: props.vpc,
      scaling: {
        autoPause: Duration.minutes(10),
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_4,
      },
      enableDataApi: true,
      credentials: rds.Credentials.fromSecret(databaseCredentials),
      securityGroups: [rdsSecurityGroup],
    });

    // Grant access to the RDS cluster from the EKS cluster
    props.eksCluster.addManifest('RdsServiceAccount', {
      apiVersion: 'v1',
      kind: 'ServiceAccount',
      metadata: {
        name: 'rds-service-account',
        namespace: 'default',
      },
    });

    new CfnOutput(this, 'RdsEndpoint', {
      value: rdsCluster.clusterEndpoint.socketAddress,
      description: 'RDS Cluster Endpoint',
    });
  }
}
