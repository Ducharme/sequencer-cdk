#helm install datadog-agent -f datadog-values.yaml datadog/datadog

Datadog agents are spinning up on each node in your cluster. After a few
minutes, you should see your agents starting in your event stream:
    https://app.datadoghq.com/event/explorer

The Datadog Agent is listening on port 8126 for APM service.

#################################################################
####               WARNING: Deprecation notice               ####
#################################################################

The option `datadog.apm.enabled` is deprecated, please use `datadog.apm.portEnabled` to enable TCP communication to the trace-agent.
The option `datadog.apm.socketEnabled` is enabled by default and can be used to rely on unix socket or name-pipe communication.

###################################################################################
####   WARNING: Cluster-Agent should be deployed in high availability mode     ####
###################################################################################

The Cluster-Agent should be in high availability mode because the following features
are enabled:
* Admission Controller

To run in high availability mode, our recommendation is to update the chart
configuration with:
* set `clusterAgent.replicas` value to `2` replicas .
* set `clusterAgent.createPodDisruptionBudget` to `true`

---


(source:driver AND service:driver) OR (source:secrets-store-csi-driver-provider-aws AND service:secrets-store-csi-driver-provider-aws)
csi-secrets-store-secrets-store-csi-driver or secrets-store-csi-driver-provider-aws
Grok Parser: Grok Parser
I0910 15:07:28.222628       1 nodeserver.go:353] "Using gRPC client" provider="aws" pod="processorwebservice-5c9dc9b5d8-5b97c"
I0910 15:07:28.354679       1 secretproviderclasspodstatus_controller.go:368] "reconcile complete" spc="default/aws-secrets" pod="default/processorwebservice-5c9dc9b5d8-5b97c" spcps="default/processorwebservice-5c9dc9b5d8-5b97c-default-aws-secrets"
csi_driver_log %{regex("[FCEIWDT]"):log_level}%{date("MMdd HH:mm:ss.SSSSSS"):timestamp}\s+%{number:thread}\s+%{data:file}\] \"%{data:message}\" %{data::keyvalue}
Status Remapper: Log Level
log_level

Source:secrets-store-csi-driver-provider-aws AND service:secrets-store-csi-driver-provider-aws
secrets-store-csi-driver-provider-aws

Grok Parser: Grok Parser
I0910 18:20:02.507194       1 auth.go:123] Role ARN for default:sequencer-pod-service-account is arn:aws:iam::260731153371:role/EksStack-SequencerPodExecutionRoleCA5F3FE9-SVJ5uFdC9JjM
I0910 18:20:02.500967       1 server.go:124] Servicing mount request for pod processorwebservice-fcb4fd87-mm54w in namespace default using service account sequencer-pod-service-account with region(s) ap-southeast-1
csi_driver_log %{regex("[FCEIWDT]"):log_level}%{date("MMdd HH:mm:ss.SSSSSS"):timestamp}\s+%{number:thread}\s+%{data:file}\] %{data:message}(\s|\n)?





