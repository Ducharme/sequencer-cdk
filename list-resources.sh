#!/bin/sh

#echo "Key Pairs:"
aws ec2 describe-key-pairs --query 'KeyPairs[*].KeyName' --output table

#echo "Secrets (AWS Secrets Manager):"
aws secretsmanager list-secrets --query 'SecretList[*].Name' --output table

#echo "VPCs:"
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,Tags[?Key==`Name`].Value | [0]]' --output table

#echo "Subnets:"
aws ec2 describe-subnets --query 'Subnets[*].[SubnetId,Tags[?Key==`Name`].Value | [0]]' --output table

#echo "Internet Gateways:"
aws ec2 describe-internet-gateways --query 'InternetGateways[*].[InternetGatewayId,Tags[?Key==`Name`].Value | [0]]' --output table

#echo "Elastic IPs:"
aws ec2 describe-addresses --query 'Addresses[*].[PublicIp,Tags[?Key==`Name`].Value | [0]]' --output table

#echo "NAT Gateways:"
aws ec2 describe-nat-gateways --query 'NatGateways[*].[NatGatewayId,Tags[?Key==`Name`].Value | [0]]' --output table

#echo "Route Tables:"
aws ec2 describe-route-tables --query 'RouteTables[*].[RouteTableId,Tags[?Key==`Name`].Value | [0]]' --output table

#echo "Security Groups:"
aws ec2 describe-security-groups --query 'SecurityGroups[*].[GroupId,GroupName]' --output table

#echo "IAM Roles (including instance roles):"
aws iam list-roles --query 'Roles[*].RoleName' --output table

#echo "Instance Profiles:"
aws iam list-instance-profiles --query 'InstanceProfiles[*].InstanceProfileName' --output table

#echo "Launch Templates:"
aws ec2 describe-launch-templates --query 'LaunchTemplates[*].[LaunchTemplateName,LaunchTemplateId]' --output table

#echo "Auto Scaling Groups:"
aws autoscaling describe-auto-scaling-groups --query 'AutoScalingGroups[*].AutoScalingGroupName' --output table

#echo "EKS clusters:"
aws eks list-clusters --query 'clusters' --output table

#echo "Lambda Functions:"
aws lambda list-functions --query 'Functions[*].FunctionName' --output table

#echo "Aurora Clusters (including both provisioned and Serverless v1):"
aws rds describe-db-clusters --query 'DBClusters[*].[DBClusterIdentifier,EngineMode]' --output table

#echo "Aurora Serverless v2 Clusters:"
aws rds describe-db-clusters --query 'DBClusters[?EngineMode==`provisioned` && ServerlessV2ScalingConfiguration!=`null`].[DBClusterIdentifier]' --output table

#echo "Aurora Instances (including both provisioned and Serverless v1):"
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,EngineVersion]' --output table

#echo "Aurora Serverless v2 Instances:"
aws rds describe-db-instances --query 'DBInstances[?ServerlessV2ScalingConfiguration!=`null`].[DBInstanceIdentifier]' --output table

#echo "ElastiCache Redis Groups (Replication Groups):"
aws elasticache describe-replication-groups --query 'ReplicationGroups[*].ReplicationGroupId' --output table

#echo "ElastiCache Redis Users:"
aws elasticache describe-users --query 'Users[*].UserId' --output table

#echo "ElastiCache Redis Clusters:"
aws elasticache describe-cache-clusters --query 'CacheClusters[*].CacheClusterId' --output table

#echo "ElastiCache Redis Serverless Clusters:"
aws elasticache describe-serverless-caches --query 'ServerlessCaches[*].ServerlessCacheName' --output table

#echo "SAML Identity providers:"
aws iam list-saml-providers --query 'SAMLProviderList[*].Arn' --output table

#echo "OpenID Connect (OIDC) providers:"
aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[*].Arn' --output table

echo "DONE"
