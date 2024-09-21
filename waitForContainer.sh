#!/bin/sh

waitForContainer() {
    waitMaxTime=$1
    containerHost=$2
    containerPort=$3

    local success=1  # Initialize to 1 (failure), will set to 0 if we get a 200
    for i in $(seq 1 $waitMaxTime); do
        echo -n "http://$containerHost:$containerPort/healthz (#$i) -> "
        output=$(curl -s -X GET "http://$containerHost:$containerPort/healthz")
        status=$?
        if [ $status -eq 0 ]; then
            echo "$output"
            if [ "$output" = "200" ]; then
                success=0  # Set to 0 (success) if we get a 200
                echo ""
                break # Exit the loop early on success
            fi
        else
            echo "Failed (exit code $status)"
        fi
        #echo "" # This will always print a newline
        sleep 1
    done
    return $success
}
