# Datadog

## Installing the agent

```
helm install datadog-agent -f datadog-values.yaml datadog/datadog
```
Output
```
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
```


## Setup log pipelines

1. Click on Logs on the left bar
2. Click on Log Settings button on the upper right corner [logs/pipelines](https://us5.datadoghq.com/logs/pipelines)

### Grok Parser for csi-driver pipeline

1. Click on + Add a new pipeline
2. Enter in Filter box "source:driver AND service:driver"
3. Enter in Name box "Grok Parser for driver"
4. Expand the pipeline just created
5. Click + Add processor
6. Select the processor type: Grok Parser
7. Enter in Name box: Grok Parser
8. Enter these logs lines in Log samples box
```
I0910 15:07:28.222628       1 nodeserver.go:353] "Using gRPC client" provider="aws" pod="processorwebservice-5c9dc9b5d8-5b97c"
I0910 15:07:28.354679       1 secretproviderclasspodstatus_controller.go:368] "reconcile complete" spc="default/aws-secrets" pod="default/processorwebservice-5c9dc9b5d8-5b97c" spcps="default/processorwebservice-5c9dc9b5d8-5b97c-default-aws-secrets"
I1024 22:21:44.765055       1 nodeserver.go:253] "node publish volume complete" targetPath="/var/lib/kubelet/pods/17a88655-27fd-4cc7-a693-92c8e0e9d82a/volumes/kubernetes.io~csi/secrets-store-inline/mount" pod="default/processorwebservice-7479bc9f88-8fmpx" time="966.003016ms"
I1024 21:13:27.405097       1 secrets-store.go:46] "Initializing Secrets Store CSI Driver" driver="secrets-store.csi.k8s.io" version="v1.4.5" buildTime="2024-08-20-17:14"
I1024 21:13:28.304482       1 nodeserver.go:359] "node: getting default node info"
I1024 21:13:27.304563       1 main.go:195] "starting manager"
```
9. Enter below query in Define parsing rules 
```
csi_driver_log %{regex("[FCEIWDT]"):log_level}%{date("MMdd HH:mm:ss.SSSSSS"):timestamp}\s+%{number:thread}\s+%{data:file}\] \"%{data:message}\" %{data::keyvalue}
```
10. Click + Add processor again
11. Select the processor type: Status Remapper
12. Enter in Name box: Log Level
13. Enter in the Set status attribute(s): log_level

### Grok Parser for secrets-store-csi-driver-provider-aws pipeline

1. Click on + Add a new pipeline
2. Enter in Filter box "source:secrets-store-csi-driver-provider-aws AND service:secrets-store-csi-driver-provider-aws"
3. Enter in Name box "Grok Parser for secrets-store-csi-driver-provider-aws"
4. Expand the pipeline just created
5. Click + Add processor
6. Select the processor type: Grok Parser
7. Enter in Name box: Grok Parser
8. Enter these logs lines in Log samples box
```
I0910 18:20:02.507194       1 auth.go:123] Role ARN for default:sequencer-pod-service-account is arn:aws:iam::260731153371:role/EksStack-SequencerPodExecutionRoleCA5F3FE9-SVJ5uFdC9JjM
I0910 18:20:02.500967       1 server.go:124] Servicing mount request for pod processorwebservice-fcb4fd87-mm54w in namespace default using service account sequencer-pod-service-account with region(s) ap-southeast-1
```
9. Enter below query in Define parsing rules 
```
csi_driver_log %{regex("[FCEIWDT]"):log_level}%{date("MMdd HH:mm:ss.SSSSSS"):timestamp}\s+%{number:thread}\s+%{data:file}\] %{data:message}(\s|\n)?
```

csi-secrets-store-secrets-store-csi-driver