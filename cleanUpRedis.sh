#!/bin/sh

GROUP_NAME1=poc
ADMIN_CONTAINER_HOST1=$(kubectl get service adminwebportal-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
ADMIN_CONTAINER_PORT1=80

clean_up() {
    local server_name=$1
    local server_port=$2
    local group_name=$3

    echo -n "curl -s -X DELETE http://$server_name:$server_port/messages?name=$group_name -> "
    output=$(curl -s -X DELETE "http://$server_name:$server_port/messages?name=$group_name")
    status=$?
    if [ $status -eq 0 ]; then
        echo "$output"
        if [ "$output" = "200" ]; then
            echo ""
        fi
    else
        echo "Failed (exit code $status)"
    fi

    echo -n "curl -s -X DELETE -H \"Content-Type: application/json\" -d \"{\"name\":\"$group_name\"}\" \"http://$server_name:$server_port/messages\" -> "
    output=$(curl -X DELETE -s -H "Content-Type: application/json" -d "{\"name\":\"$group_name\"}" "http://$server_name:$server_port/messages")
    status=$?
    if [ $status -eq 0 ]; then
        echo "$output"
        if [ "$output" = "200" ]; then
            echo ""
        fi
    else
        echo "Failed (exit code $status)"
    fi
}

clean_up "$ADMIN_CONTAINER_HOST1" "$ADMIN_CONTAINER_PORT1" "$GROUP_NAME1"
