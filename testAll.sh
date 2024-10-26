#!/bin/sh

GROUP_NAME=poc
NB_PROCESSORS=10
NB_SEQUENCERS=3
START_WAIT_TIME_SEC=20
END_WAIT_TIME_SEC=15
ADMIN_WAIT_TIME_SEC=5
SEQUENCER_WAIT_TIME_SEC=5
PROCESSOR_WAIT_TIME_SEC=5

NB_MESSAGES=60000
CREATION_DELAY_MS=0
PROCESSING_DELAY_MS=0

. ./setRedisStackName.sh

#ADMIN_CONTAINER_HOST=localhost
#ADMIN_CONTAINER_PORT=8080
ADMIN_CONTAINER_HOST=$(kubectl get service adminwebportal-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
ADMIN_CONTAINER_PORT=80
REDIS_CACHE_NAME=$(aws cloudformation describe-stacks --stack-name $REDIS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='RedisCacheName'].OutputValue" --output text)

if [ "$IS_SERVERLESS" = "true" ]; then
    MAX_ECPU=$(aws elasticache describe-serverless-caches --serverless-cache-name $REDIS_CACHE_NAME --query 'ServerlessCaches[0].CacheUsageLimits.ECPUPerSecond.Maximum')
else
    CLUSTER_ID=$(aws elasticache describe-cache-clusters --query 'CacheClusters[*].CacheClusterId' | grep $REDIS_CACHE_NAME | tr -d '" \t')
    INSTANCE_TYPE=$(aws elasticache describe-cache-clusters --cache-cluster-id $CLUSTER_ID --query 'CacheClusters[0].CacheNodeType' | tr -d '" \t')
    MAX_ECPU=$INSTANCE_TYPE
fi
echo "GROUP_NAME=$GROUP_NAME NB_PROCESSORS=$NB_PROCESSORS NB_SEQUENCERS=$NB_SEQUENCERS NB_MESSAGES=$NB_MESSAGES CREATION_DELAY_MS=$CREATION_DELAY_MS PROCESSING_DELAY_MS=$PROCESSING_DELAY_MS ECPU=$MAX_ECPU"
echo "START_WAIT_TIME_SEC=$START_WAIT_TIME_SEC ADMIN_WAIT_TIME_SEC=$ADMIN_WAIT_TIME_SEC SEQUENCER_WAIT_TIME_SEC=$SEQUENCER_WAIT_TIME_SEC PROCESSOR_WAIT_TIME_SEC=$PROCESSOR_WAIT_TIME_SEC"
echo "The current time is $(date +"%H:%M:%S"), starting services"

. ./waitForContainer.sh

# AdminService

echo "ADMIN_CONTAINER_HOST=$ADMIN_CONTAINER_HOST and ADMIN_CONTAINER_PORT=$ADMIN_CONTAINER_PORT"
kubectl apply -f k8s/adminwebportal-deployment.yml
kubectl scale deployment adminwebportal --replicas=1
kubectl rollout status deployment adminwebportal
echo ""
waitForContainer $START_WAIT_TIME_SEC $ADMIN_CONTAINER_HOST $ADMIN_CONTAINER_PORT
if [ $? -eq 0 ]; then
    echo "Container is ready (got 200 status)"
else
    echo "Container failed to become ready within the timeout period"
    exit 1
fi

echo  "curl -s -X DELETE \"http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/messages?name=$GROUP_NAME\""
curl -s -X DELETE "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/messages?name=$GROUP_NAME"
sleep $ADMIN_WAIT_TIME_SEC
echo ""

# SequencerWebService

kubectl apply -f k8s/sequencerwebservice-deployment.yml
kubectl scale deployment sequencerwebservice --replicas=$NB_SEQUENCERS
kubectl rollout status deployment sequencerwebservice
sleep $SEQUENCER_WAIT_TIME_SEC

# ProcessorWebService

kubectl apply -f k8s/processorwebservice-deployment.yml
kubectl scale deployment processorwebservice --replicas=$NB_PROCESSORS
kubectl rollout status deployment processorwebservice
sleep $PROCESSOR_WAIT_TIME_SEC

echo "The current time is $(date +"%H:%M:%S"), waiting $START_WAIT_TIME_SEC seconds to start"
sleep $START_WAIT_TIME_SEC
echo "The current time is $(date +"%H:%M:%S"), generating data now"

# Initialize data

echo curl -s -X POST -H "Content-Type: application/json" -d "{\"name\":\"$GROUP_NAME\", \"numberOfMessages\": $NB_MESSAGES, \"creationDelay\": $CREATION_DELAY_MS, \"processingTime\": $PROCESSING_DELAY_MS}" "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/messages"
curl -s -X POST -H "Content-Type: application/json" -d "{\"name\":\"$GROUP_NAME\", \"numberOfMessages\": $NB_MESSAGES, \"creationDelay\": $CREATION_DELAY_MS, \"processingTime\": $PROCESSING_DELAY_MS}" "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/messages"
echo ""

# Waiting for completion

. ./waitForCompletion.sh
waitForCompletion $NB_MESSAGES $ADMIN_CONTAINER_HOST $ADMIN_CONTAINER_PORT $GROUP_NAME

echo "The current time is $(date +"%H:%M:%S"), waiting $END_WAIT_TIME_SEC seconds before generating stats"
sleep $END_WAIT_TIME_SEC

# Display statistics

echo "The current time is $(date +"%H:%M:%S"), displaying stats"
# Determine the increment based on NB_MESSAGES
if [ "$NB_MESSAGES" -le 1000 ]; then
    increment=100
elif [ "$NB_MESSAGES" -le 10000 ]; then
    increment=1000
elif [ "$NB_MESSAGES" -le 100000 ]; then
    increment=10000
else
    increment=100000  # Default for larger numbers
fi
start=1
end=$NB_MESSAGES
while [ "$start" -lt "$end" ]; do
  echo "Stats from $((start)) to $((start+increment-1))"
  curl -s -X GET "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/list/stats?name=$GROUP_NAME&start=$start&count=$increment"
  echo ""
  start=$((start + increment))
done


echo ""
start=1
end=$NB_MESSAGES
echo "ALL -- Stats from $start to $end"
curl -s -X GET "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/list/stats?name=$GROUP_NAME&start=$start&count=$end"
echo ""
echo "ALL -- Perfs from $start to $end"
curl -s -X GET "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/list/perfs?name=$GROUP_NAME&start=$start&count=$end"
echo ""

kubectl delete -f k8s/processorwebservice-deployment.yml
kubectl delete -f k8s/sequencerwebservice-deployment.yml
kubectl delete -f k8s/adminwebportal-deployment.yml

echo "DONE RUNNING!"
