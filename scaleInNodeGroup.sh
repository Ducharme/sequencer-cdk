#!/bin/sh

CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name EksStack --query "Stacks[0].Outputs[?OutputKey=='EksClusterName'].OutputValue" --output text)

NODE_GROUP=$(aws eks list-nodegroups --cluster-name $CLUSTER_NAME --output text | tr '\t' '\n' | grep "^SequencerEksClusterNode" | head -n 1)

aws eks update-nodegroup-config --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP --scaling-config desiredSize=0
aws eks desc-nodegroup-config --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP --scaling-config desiredSize=0
aws eks describe-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP
