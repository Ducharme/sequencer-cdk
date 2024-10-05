
# Performance

## Single pod per service (1 processor and 1 sequencer)

NB_PROCESSORS=1 NB_SEQUENCERS=1 NB_MESSAGES=60000 CREATION_DELAY_MS=0 PROCESSING_DELAY_MS=0
Servers: 1xEC2 c7i.xlarge spot
Redis serverless ElastiCache - ECPUs: Max set at 10,000 but reached 238,332 at burst
Processor pod at 400 mcores and most pods unders 480 MB RAM except admin at 768 MB
Peak at 13 ms delay on the processor and 12 ms on sequencer
Highest duration on processor EVAL at 13.2 ms then sequencer EVAL at 11.8 ms
System load peaking at 1.7 CPU (total of 4 vCPU and 8 GB RAM)
Network traffic under 1 MB/s
Disk latency under 6 ms
Redis OSS cache Data Stored: 13.6 MB
60,000 messages sequenced in 250 seconds -> 240 msg/s

## Multiple pods per service (10 processor and 3 sequencer) - Serverless

NB_PROCESSORS=10 NB_SEQUENCERS=3 NB_MESSAGES=60000 CREATION_DELAY_MS=0 PROCESSING_DELAY_MS=0
Servers: 3xEC2 c7i.xlarge spot
Redis serverless ElastiCache - ECPUs: Max 1,000,000 ECPUs but reached 1,129,009 at burst
Sequencer pod at 600 mcores and most pods unders 512 MB RAM except admin at 768 MB
Peak at 30 ms delay on the processor and 25 ms on sequencer
Highest duration on processor EVAL at 33.6 ms then sequencer EVAL at 26.4 ms
System load peaking at 6.06 CPU (total of 12 vCPU and 24 GB RAM)
Network traffic under 4 MB/s
Disk latency under 2 ms
Redis OSS cache Data Stored: 13.6 MB
60,000 messages sequenced in 35 seconds -> 1,714 msg/s

## Multiple pods per service (10 processor and 3 sequencer) - Cluster

NB_PROCESSORS=10 NB_SEQUENCERS=3 NB_MESSAGES=60000 CREATION_DELAY_MS=0 PROCESSING_DELAY_MS=0
Servers: 3xEC2 c7i.xlarge spot
Redis ElastiCache - 1x r7g.xlarge but reached 1,129,009 at burst
Sequencer pod at 600 mcores and most pods unders 512 MB RAM except admin at 768 MB
Peak at 64 ms delay on the sequencer and 19 ms on processor
System load peaking at 3.5 CPU (total of 12 vCPU and 24 GB RAM)
Network traffic under 12 MB/s
Disk latency under 13 ms
Redis OSS cache: Data Stored 42 MiB, 17% CPU on the node, 1150 Gets/s, 7080 Sets/s
60,000 messages sequenced in 19 seconds -> 3158 msg/s

## Note on using 1,000 ECPUs when Serverless

Either the AWS EKS node will be too slow to respond to API call or the ECPUs will be capped

First situation :all pods will have to be re-scheduled on the new node adding significant delays
- 1x m7i.xlarge, NodeNotReady: Node is not ready
- Spot instance is terminated due to API not timely responding
- Burst 4 seconds for 1000 messages for 1 pod

Second situation: 
- ElastiCacheProcessingUnits capped at 60,000 ECPUs Consumed/minute
