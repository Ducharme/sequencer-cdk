#!/bin/sh

REDIS_PASSWORD_SECRET_NAME=$(aws cloudformation describe-stacks --stack-name RedisStack --query "Stacks[0].Outputs[?OutputKey=='RedisPasswordSecretName'].OutputValue" --output text)

# Generate ConfigMap YAML
mkdir -p .tmp

TEMPLATE_YAML=k8s/secretProviderClass-template.yml
VALUES_YAML=.tmp/secretProviderClass.yml
cp $TEMPLATE_YAML $VALUES_YAML

sed -i 's@RedisPasswordSecretName@'"$REDIS_PASSWORD_SECRET_NAME"'@g' $VALUES_YAML
