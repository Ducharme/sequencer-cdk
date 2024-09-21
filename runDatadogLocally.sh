!/bin/sh

. setDatadogEnvVars.sh

# docker run -d --name datadog-agent \
#            -e DD_API_KEY=$DATADOG_API_KEY \
#            -e DD_LOGS_ENABLED=true \
#            -e DD_LOGS_INJECTION=true \
#            -e DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true \
#            -e DD_CONTAINER_EXCLUDE_LOGS="name:datadog-agent" \
#            -e DD_SITE="datadoghq.com" \
#            -e DD_APM_ENABLED=true \
#            -e DD_APM_NON_LOCAL_TRAFFIC=true \
#            -e DD_APM_RECEIVER_SOCKET=/var/run/datadog/apm.socket \
#            -e DD_DOGSTATSD_SOCKET=/var/run/datadog/dsd.socket \
#            -v /var/run/datadog:/var/run/datadog \
#            -v /var/run/docker.sock:/var/run/docker.sock:ro \
#            -v /proc/:/host/proc/:ro \
#            -v /opt/datadog-agent/run:/opt/datadog-agent/run:rw \
#            -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro \
# 		   -v /var/lib/docker/containers:/var/lib/docker/containers:ro \
# 		   -e DD_ENV="poc" \
# 		   -e DD_SERVICE="sequencer" \
# 		   -e DD_VERSION="0.0.1" \
# 		   -l com.datadoghq.tags.env="poc" \
# 		   -l com.datadoghq.tags.service="sequencer" \
# 		   -l com.datadoghq.tags.version="0.0.1" \
#            datadog/agent:latest
