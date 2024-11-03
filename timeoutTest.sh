#!/bin/sh

GROUP_NAME=poc
ADMIN_CONTAINER_HOST=$(kubectl get service adminwebportal-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
ADMIN_CONTAINER_PORT=80
START_WAIT_TIME_SEC=20

kubectl delete -f k8s/adminwebportal-deployment.yml
kubectl apply -f k8s/adminwebportal-deployment.yml
kubectl scale deployment adminwebportal --replicas=1
kubectl rollout status deployment adminwebportal
echo ""

. ./waitForContainer.sh
waitForContainer $START_WAIT_TIME_SEC $ADMIN_CONTAINER_HOST $ADMIN_CONTAINER_PORT
if [ $? -eq 0 ]; then
    echo "Container is ready (got 200 status)"
else
    echo "Container failed to become ready within the timeout period"
    exit 1
fi

start=1
end=10000
#end=60000

echo "ALL -- Stats from $start to $end at $(date +"%H:%M:%S")"
curl -s -X GET "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/list/stats?name=$GROUP_NAME&start=$start&count=$end"
echo ""
echo "ALL -- Perfs from $start to $end at $(date +"%H:%M:%S")"
curl -s -X GET "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/list/perfs?name=$GROUP_NAME&start=$start&count=$end"
echo ""
echo "The current time is $(date +"%H:%M:%S"), dumping the state of the system"
# --raw --show-error --verbose --no-buffer --max-time 300 --keepalive-time 30
curl -s -X GET "http://$ADMIN_CONTAINER_HOST:$ADMIN_CONTAINER_PORT/dump?name=$GROUP_NAME"
echo "The current time is $(date +"%H:%M:%S"), done dumping the state of the system"
