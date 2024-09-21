#!/bin/sh

. ./cleanUpRedis.sh
. ./flushAllRedis.sh

kubectl delete -f k8s/processorwebservice-deployment.yml
kubectl delete -f k8s/sequencerwebservice-deployment.yml
kubectl delete -f k8s/adminwebportal-deployment.yml

echo "DONE!"
