#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { EksStack } from '../lib/eks-stack';
import { RedisServerlessStack } from '../lib/redis-serverless-stack';
import { RedisClusterStack } from '../lib/redis-cluster-stack';
//import { RdsStack } from '../lib/rds-stack'; // TODO: Test

function readFileSync(filePath: string): string {
  try {
    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Read the file synchronously
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    
    return content;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
    throw error;
  }
}

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

const fileContent = readFileSync('.env.poc');
console.log(fileContent);
const lines = fileContent.split('\n');
const serverlessLine : string | undefined = lines.find(line => line.startsWith('SERVERLESS='));
var isServerless : boolean = serverlessLine!.trim().split("=")[1].toLowerCase() == "true";
if (isServerless) {
  new RedisServerlessStack(app, 'RedisServerlessStack', { vpc: vpcStack.vpc, eksCluster: eksStack.cluster, ...props });
} else {
  new RedisClusterStack(app, 'RedisClusterStack', { vpc: vpcStack.vpc, eksCluster: eksStack.cluster, ...props });
}
//const rdsStack = new RdsStack(app, 'RdsStack', { vpc: vpcStack.vpc, eksCluster: eksStack.cluster, ...props });
