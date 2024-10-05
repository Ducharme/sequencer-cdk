#!/bin/sh

. ./setRedisStackName.sh
REDIS_PASSWORD_SECRET_NAME=$(aws cloudformation describe-stacks --stack-name $REDIS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='RedisPasswordSecretName'].OutputValue" --output text)

# Generate ConfigMap YAML
mkdir -p .tmp

TEMPLATE_YAML=k8s/secretProviderClass-template.yml
VALUES_YAML=.tmp/secretProviderClass.yml
cp $TEMPLATE_YAML $VALUES_YAML

sed -i 's@RedisPasswordSecretName@'"$REDIS_PASSWORD_SECRET_NAME"'@g' $VALUES_YAML

kubectl apply -f .tmp/secretProviderClass.yml

echo "Creating a pod to pull the aws-secrets/redis-password"
kubectl apply -f k8s/secret-watcher-pod.yml

echo "Waiting for secret to be created..."
kubectl wait --for=condition=ready pod/secret-watcher --timeout=300s
if [ $? -eq 0 ]; then
    echo "Secret has been successfully created and mounted!"
else
    echo "Timeout waiting for secret to be created."
    exit 1
fi

echo "kubectl get secret aws-secrets"
kubectl get secret aws-secrets

# Clean up
kubectl delete pod secret-watcher
