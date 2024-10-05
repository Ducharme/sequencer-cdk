#!/bin/sh

helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm repo add aws-secrets-manager https://aws.github.io/secrets-store-csi-driver-provider-aws
helm repo add autoscaler https://kubernetes.github.io/autoscaler

helm repo update

helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver -f k8s/secrets-store-csi-values.yml -n kube-system
# syncSecret.enabled=true https://secrets-store-csi-driver.sigs.k8s.io/topics/sync-as-kubernetes-secret
# Now you can follow these steps https://secrets-store-csi-driver.sigs.k8s.io/getting-started/usage.html
# kubectl --namespace=kube-system get pods -l "app=secrets-store-csi-driver"

helm install secrets-provider-aws aws-secrets-manager/secrets-store-csi-driver-provider-aws --namespace kube-system

CLUSTER_NAME=$(aws cloudformation describe-stacks --stack-name EksStack --query "Stacks[0].Outputs[?OutputKey=='EksClusterName'].OutputValue" --output text)
CLUSTER_AUTOSCALER_SERVICE_ACCOUNT_NAME=$(aws cloudformation describe-stacks --stack-name EksStack --query "Stacks[0].Outputs[?OutputKey=='ClusterAutoscalerRoleName'].OutputValue" --output text)
CLUSTER_AUTOSCALER_SERVICE_ACCOUNT_ARN=$(aws cloudformation describe-stacks --stack-name EksStack --query "Stacks[0].Outputs[?OutputKey=='ClusterAutoscalerRoleArn'].OutputValue" --output text)

helm install cluster-autoscaler autoscaler/cluster-autoscaler --namespace kube-system \
    --set autoDiscovery.clusterName=$CLUSTER_NAME \
    --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$CLUSTER_AUTOSCALER_SERVICE_ACCOUNT_ARN \
    --set rbac.serviceAccount.name=$CLUSTER_AUTOSCALER_SERVICE_ACCOUNT_NAME \
    --set "extraArgs.balance-similar-node-groups=true" \
    --set "extraArgs.skip-nodes-with-system-pods=false"
