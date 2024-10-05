#!/bin/sh

ENV_FILE=.env.poc
SERVERLESS=$(grep SERVERLESS $ENV_FILE | cut -d '=' -f2)
IS_SERVERLESS=$(if [ "$(echo "$SERVERLESS" | tr '[:upper:]' '[:lower:]')" = "true" ]; then echo "true"; else echo "false"; fi)
REDIS_STACK_NAME=$(if [ "$IS_SERVERLESS" = "true" ]; then echo "RedisServerlessStack"; else echo "RedisClusterStack"; fi)
