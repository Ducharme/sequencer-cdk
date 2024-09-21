#!/bin/sh

DD_CFG_FILE=.datadog

if [ ! -f "$DD_CFG_FILE" ]; then
    echo "The provided $DD_CFG_FILE file does not exist"
    exit 2
fi

GREP_DATADOG_API_KEY=$(grep DATADOG_API_KEY $DD_CFG_FILE)
GREP_DATADOG_APP_KUBERNETES_KEY=$(grep DATADOG_APP_KUBERNETES_KEY $DD_CFG_FILE)
GREP_DATADOG_SITE=$(grep DATADOG_SITE $DD_CFG_FILE)

if [ -z "$GREP_DATADOG_API_KEY" ]; then
    echo "The provided $DD_CFG_FILE file does not contain DATADOG_API_KEY variable"
    exit 3
elif [ -z "$GREP_DATADOG_APP_KUBERNETES_KEY" ]; then
    echo "The provided $DD_CFG_FILE file does not contain DATADOG_APP_KUBERNETES_KEY variable"
    exit 4
elif [ -z "$GREP_DATADOG_SITE" ]; then
    echo "The provided $DD_CFG_FILE file does not contain DATADOG_SITE variable"
    exit 4
fi

export DATADOG_API_KEY=$(echo "$GREP_DATADOG_API_KEY" | cut -d '=' -f2)
export DATADOG_APP_KUBERNETES_KEY=$(echo "$GREP_DATADOG_APP_KUBERNETES_KEY" | cut -d '=' -f2)
export DATADOG_SITE=$(echo "$GREP_DATADOG_SITE" | cut -d '=' -f2)

