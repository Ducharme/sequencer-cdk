
#!/bin/sh

GROUP_NAME=poc
START_WAIT_TIME_SEC=20
NB_MESSAGES=600000

echo "The current time is $(date +"%H:%M:%S"), starting"


# AdminService

ADMIN_CONTAINER_PORT=80
ADMIN_CONTAINER_HOST=$(kubectl get service adminwebportal-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ADMIN_CONTAINER_HOST=$ADMIN_CONTAINER_HOST and ADMIN_CONTAINER_PORT=$ADMIN_CONTAINER_PORT"
kubectl apply -f k8s/adminwebportal-deployment.yml
kubectl scale deployment adminwebportal --replicas=1
kubectl rollout status deployment adminwebportal
echo ""

. ./waitForContainer.sh
waitForContainer $START_WAIT_TIME_SEC $ADMIN_CONTAINER_HOST $ADMIN_CONTAINER_PORT


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
