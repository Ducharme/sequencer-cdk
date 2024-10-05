import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec from 'aws-cdk-lib/aws-elasticache';
import { RedisBaseStack } from './redis-base-stack';

interface RedisClusterStackProps extends StackProps {
  vpc: ec2.Vpc;
  eksCluster: eks.Cluster;
}

export class RedisClusterStack extends Stack {
  constructor(scope: Construct, id: string, props: RedisClusterStackProps) {
    super(scope, id, props);

    const baseStack = new RedisBaseStack(scope, 'RedisBaseStack', { ...props });

    // Create the ElastiCache service-linked role
    // const serviceLinkedRole = new iam.CfnServiceLinkedRole(this, 'ElastiCacheServiceLinkedRole', {
    //   awsServiceName: 'elasticache.amazonaws.com',
    //   description: 'Service-linked role for ElastiCache',
    // });
    //const cfnServiceLinkedRole = serviceLinkedRole.node.defaultChild as cdk.CfnResource;
    //cfnServiceLinkedRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create the CloudWatch Logs group
    // const logGroup = new logs.LogGroup(this, 'RedisLogGroup', {
    //   logGroupName: '/aws/elasticache/sequencer-redis',
    //   retention: logs.RetentionDays.ONE_WEEK, // Adjust retention period as needed
    //   removalPolicy: cdk.RemovalPolicy.DESTROY, // Delete the log group when the stack is destroyed
    // });

    // Grant permissions to the service-linked role to write to the log group
    //logGroup.grantWrite(new iam.ServicePrincipal('elasticache.amazonaws.com'));

    /*const redis = new ec.CfnCacheCluster(this, 'RedisCluster', {
      clusterName: 'sequencer-redis',
      engine: 'redis',
      cacheNodeType: 'cache.r7g.xlarge',
      numCacheNodes: 1,
      engineVersion: '7.1',
      cacheSubnetGroupName: baseStack.redisSubnetGroup.ref,
      vpcSecurityGroupIds: [baseStack.redisSecurityGroup.securityGroupId],
      transitEncryptionEnabled: true,
      userGroupIds: ['power-group'],
      port: 6379,
      logDeliveryConfigurations: [
        {
          destinationType: 'cloudwatch-logs',
          destinationDetails: {
            cloudWatchLogsDetails: {
              logGroup: '/aws/elasticache/sequencer-redis'
            }
          },
          logFormat: 'json',
          logType: 'slow-log'
        },
        {
          destinationType: 'cloudwatch-logs',
          destinationDetails: {
            cloudWatchLogsDetails: {
              logGroup: '/aws/elasticache/sequencer-redis'
            }
          },
          logFormat: 'json',
          logType: 'engine-log'
        }
      ]
    });
    const userGroupAssociation = new ec.CfnUserGroupsForCacheCluster(this, 'UserGroupAssociation', {
      cacheClusterId: redis.ref,
      userGroupIds: ['power-group'],
    });*/
    
    const redis = new ec.CfnReplicationGroup(this, 'RedisCluster', {
      replicationGroupId: 'sequencer-redis',
      replicationGroupDescription: 'Sequencer Redis Cluster',
      engine: 'redis',
      cacheNodeType: 'cache.r7g.xlarge',
      numNodeGroups: 1,
      replicasPerNodeGroup: 0, // NOTE: Set to 0 for a single-node setup, or higher for multi-node
      automaticFailoverEnabled: false, // NOTE: Set to true for non-poc envs
      multiAzEnabled: false, // NOTE: Set to true for non-poc envs
      engineVersion: '7.1',
      cacheSubnetGroupName: baseStack.redisSubnetGroup.ref,
      securityGroupIds: [baseStack.redisSecurityGroup.securityGroupId],
      transitEncryptionEnabled: true,
      atRestEncryptionEnabled: true,
      port: 6379,
      userGroupIds: [baseStack.userGroup.userGroupId],
      // logDeliveryConfigurations: [
      //   {
      //     destinationType: 'cloudwatch-logs',
      //     destinationDetails: {
      //       cloudWatchLogsDetails: {
      //         logGroup: '/aws/elasticache/sequencer-redis'
      //       }
      //     },
      //     logFormat: 'json',
      //     logType: 'slow-log'
      //   },
      //   {
      //     destinationType: 'cloudwatch-logs',
      //     destinationDetails: {
      //       cloudWatchLogsDetails: {
      //         logGroup: '/aws/elasticache/sequencer-redis'
      //       }
      //     },
      //     logFormat: 'json',
      //     logType: 'engine-log'
      //   }
      // ]
    });
    redis.addDependency(baseStack.userGroup);

    new CfnOutput(this, 'RedisCacheName', {
      value: redis.replicationGroupId!,
      description: 'Redis CacheName',
    });
    new CfnOutput(this, 'RedisEndpoint', {
      value: redis.attrPrimaryEndPointAddress,
      description: 'Redis Endpoint',
    });
    new CfnOutput(this, 'RedisPort', {
      value: redis.attrPrimaryEndPointPort!.toString(),
      description: 'Redis Port',
    });
    new CfnOutput(this, 'RedisUser', {
      value: baseStack.powerRedisUser.userId,
      description: 'Redis User',
    });
    new CfnOutput(this, 'RedisPasswordSecretName', {
      value: baseStack.redisPassword.secretName ?? "",
      description: 'Redis Password SecretName',
    });
  }
}
