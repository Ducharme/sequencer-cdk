#!/bin/sh

. ./cleanUpRedis.sh
. ./flushAllRedis.sh

delete_deployment_if_exists() {
    local deployment_name=$1

    if kubectl get deploy | grep -q "$deployment_name"; then
        echo "Deployment $deployment_name exists, proceeding with deletion"
        kubectl delete deploy $deployment_name
    else
        echo "Deployment $deployment_name does not exist"
    fi
}

delete_deployment_if_exists "processorwebservice"
delete_deployment_if_exists "sequencerwebservice"
delete_deployment_if_exists "adminwebportal"

echo "DONE!"
