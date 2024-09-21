#!/bin/sh

GROUP_NAME1=poc
GROUP_NAME2=
ADMIN_CONTAINER_HOST1=localhost
ADMIN_CONTAINER_PORT1=8080
ADMIN_CONTAINER_HOST2=$(kubectl get service adminwebportal-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
ADMIN_CONTAINER_PORT2=80

clean_up() {
    local server_name=$1
    local server_port=$2
    local group_name=$3
    echo -n "curl -s -X DELETE http://$server_name:$server_port/messages?name=$group_name -> " && curl -s -X DELETE "http://$server_name:$server_port/messages?name=$group_name" -w '\n' && echo ""
    echo -n "curl -s -X DELETE -H "Content-Type: application/json" -d \"{\"name\":\"$group_name\"}\" \"http://$server_name:$server_port/messages\" -> " && curl -X DELETE -s -H "Content-Type: application/json" -d "{\"name\":\"$group_name\"}" "http://$server_name:$server_port/messages" -w '\n' && echo  ""
}

#clean_up "$ADMIN_CONTAINER_HOST1" "$ADMIN_CONTAINER_PORT1" "$GROUP_NAME1"
#clean_up "$ADMIN_CONTAINER_HOST1" "$ADMIN_CONTAINER_PORT1" "$GROUP_NAME2"

clean_up "$ADMIN_CONTAINER_HOST2" "$ADMIN_CONTAINER_PORT2" "$GROUP_NAME1"
clean_up "$ADMIN_CONTAINER_HOST2" "$ADMIN_CONTAINER_PORT2" "$GROUP_NAME2"
