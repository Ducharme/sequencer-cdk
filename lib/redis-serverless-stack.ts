import { Construct } from 'constructs';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec from 'aws-cdk-lib/aws-elasticache';
import { RedisBaseStack } from './redis-base-stack';

interface RedisServerlessStackProps extends StackProps {
  vpc: ec2.Vpc;
  eksCluster: eks.Cluster;
}

export class RedisServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props: RedisServerlessStackProps) {
    super(scope, id, props);

    const baseStack = new RedisBaseStack(scope, 'RedisBaseStack', { ...props });

    const redis = new ec.CfnServerlessCache(this, 'RedisCluster', {
      engine: 'redis',
      serverlessCacheName: 'sequencer-redis',
      majorEngineVersion: '7',
      subnetIds: baseStack.redisSubnetGroup.subnetIds,
      securityGroupIds: [baseStack.redisSecurityGroup.securityGroupId],
      userGroupId: baseStack.userGroup.userGroupId,
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
    redis.addDependency(baseStack.userGroup);

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
      value: baseStack.powerRedisUser.userId,
      description: 'Redis User',
    });
    new CfnOutput(this, 'RedisPasswordSecretName', {
      value: baseStack.redisPassword.secretName ?? "",
      description: 'Redis Password SecretName',
    });
  }
}
