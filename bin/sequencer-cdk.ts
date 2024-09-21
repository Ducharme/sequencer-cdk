#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { EksStack } from '../lib/eks-stack';
import { RedisStack } from '../lib/redis-stack';
//import { RdsStack } from '../lib/rds-stack'; // TODO: Test

const app = new App();

var props = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
  tags: {
    'Project': 'sequencer',
    'Environment': 'poc'
  }
};

const vpcStack = new VpcStack(app, 'VpcStack', props);
const eksStack = new EksStack(app, 'EksStack', { vpc: vpcStack.vpc, ...props });
const redisStack = new RedisStack(app, 'RedisStack', { vpc: vpcStack.vpc, eksCluster: eksStack.cluster, ...props });
//const rdsStack = new RdsStack(app, 'RdsStack', { vpc: vpcStack.vpc, eksCluster: eksStack.cluster, ...props });
