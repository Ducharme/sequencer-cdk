#!/bin/sh

GROUP_NAME=poc

#PGSQL_ENDPOINT=sequencer-aurora-cluster.cluster-<random>.<region>.rds.amazonaws.com
#PGSQL_PORT=5432
#PGSQL_USERNAME=<username>
#PGSQL_PASSWORD=<password>
#PGSQL_DATABASE=sequencer

REDIS_ENDPOINT=$(aws cloudformation describe-stacks --stack-name RedisStack --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" --output text)
REDIS_PORT=$(aws cloudformation describe-stacks --stack-name RedisStack --query "Stacks[0].Outputs[?OutputKey=='RedisPort'].OutputValue" --output text)
REDIS_USER=$(aws cloudformation describe-stacks --stack-name RedisStack --query "Stacks[0].Outputs[?OutputKey=='RedisUser'].OutputValue" --output text)
REDIS_SSL_ENABLED=TRUE
REDIS_SSL_PROTOCOLS=Tls12
REDIS_CHANNEL_PREFIX=seq-app
REDIS_USE_COMMAND_MAP=TRUE
REDIS_ENABLE_COMMAND_WATCH=FALSE

# Generate ConfigMap YAML
mkdir -p .tmp

TEMPLATE_YAML=k8s/sequencer-configmap-template.yml
VALUES_YAML=.tmp/sequencer-configmap.yml
cp $TEMPLATE_YAML $VALUES_YAML

sed -i 's@GROUP_NAME_VALUE@'"$GROUP_NAME"'@g' $VALUES_YAML
sed -i 's@REDIS_ENDPOINT_VALUE@'"$REDIS_ENDPOINT"'@g' $VALUES_YAML
sed -i 's@REDIS_PORT_VALUE@'"$REDIS_PORT"'@g' $VALUES_YAML
sed -i 's@REDIS_USER_VALUE@'"$REDIS_USER"'@g' $VALUES_YAML
sed -i 's@REDIS_SSL_ENABLED_VALUE@'"$REDIS_SSL_ENABLED"'@g' $VALUES_YAML
sed -i 's@REDIS_SSL_PROTOCOLS_VALUE@'"$REDIS_SSL_PROTOCOLS"'@g' $VALUES_YAML
sed -i 's@REDIS_CHANNEL_PREFIX_VALUE@'"$REDIS_CHANNEL_PREFIX"'@g' $VALUES_YAML
sed -i 's@REDIS_USE_COMMAND_MAP_VALUE@'"$REDIS_USE_COMMAND_MAP"'@g' $VALUES_YAML
sed -i 's@REDIS_ENABLE_COMMAND_WATCH_VALUE@'"$REDIS_ENABLE_COMMAND_WATCH"'@g' $VALUES_YAML