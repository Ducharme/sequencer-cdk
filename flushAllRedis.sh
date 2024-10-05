#!/bin/sh

. ./setRedisStackName.sh
CLUSTER_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $REDIS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='RedisEndpoint'].OutputValue" --output text)

kubectl apply -f k8s/redis-cli-pod.yml
kubectl wait --for=condition=Ready pod/redis-cli
kubectl exec -it redis-cli -- redis-cli -h $CLUSTER_ENDPOINT -p 6379 --tls --cacert /etc/ssl/certs/aws-ca.pem INFO replication
kubectl exec -it redis-cli -- redis-cli -h $CLUSTER_ENDPOINT -p 6379 --tls --cacert /etc/ssl/certs/aws-ca.pem FLUSHALL
kubectl delete pod redis-cli

echo "DONE!"
