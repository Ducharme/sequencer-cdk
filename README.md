
# Pre-requisites

Follow instruction from [Pre-requisites](https://github.com/Ducharme/infraAsCodeCdk)

These tools can be skipped: CodeCommit git and jq/yq

Note 1: for kubectl please use these steps instead
```
curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-archive-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubectl
kubectl version --client
```

Note 2: for helm please use these steps instead
```
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt update
sudo apt install helm
helm version
```

Note 3: version of these tools are more recent
- npm -v should be 10.8.1 or later instead of 9.6.4
- nvm install should be v0.40.1 instead of v0.39.3
- nodejs -v should be v20.16.0 or later (from the nvm list-remote --lts)
- helm should be v3.15.4 or later instead of v3.8.2


# How To Deploy

Run below scripts (tested with Lubuntu 20.04 default terminal)

## First step: Download scripts locally (1 minute)

Create a folder for the project and go inside
```
mkdir sequencer-cdk && cd sequencer-cdk
```

Clone the repository which contains all the scripts
```
git clone https://github.com/Ducharme/sequencer-cdk
```

## First step: Download scripts locally (2 minutes)
```
cdk init
cdk bootstrap
cdk synth
```

## Third step: Deploy core infrastructure (5 + 20 + 15 minutes)

```
cdk deploy VpcStack
cdk deploy EksStack
cdk deploy RedisStack
```

## Fourth step: Configure kubectl for AWS EKS cluster

Run this command (see next step for values)
```
aws eks update-kubeconfig --name <EKS_CLUSTER_NAME> --region ap-southeast-1 --role-arn arn:aws:iam::260731153371:role/EksStack-SequencerEksMastersRole<RANDOM>
```

To get the exact command, execute
```
aws cloudformation describe-stacks --stack-name EksStack --query "Stacks[0].Outputs[?contains(OutputKey, 'SequencerEksClusterConfigCommand')].OutputValue" --output text
```

Test kubctl
```
kubectl get nodes -v=10
```

Follow these steps [Playing with Kubernetes / Setup the environment](https://github.com/Ducharme/infraAsCodeCdk/tree/main?tab=readme-ov-file#setup-the-environment-once-eksctl-is-deployed)

## Fifth step: Test connectivity to Redis from EKS cluster

Run
```
kubectl create configmap aws-ca-cert --from-file=ca.pem=k8s/AmazonRootCA1.pem
kubectl apply -f k8s/redis-cli-pod.yml
kubectl wait --for=condition=Ready pod/redis-cli
kubectl exec -it redis-cli -- redis-cli -h <YOUR_ELASTICACHE_ENDPOINT> -p 6379 --tls --insecure
kubectl exec -it redis-cli -- redis-cli -h <YOUR_ELASTICACHE_ENDPOINT> -p 6379 --tls --cacert /etc/ssl/certs/aws-ca.pem
kubectl exec -it redis-cli -- redis-cli -h <YOUR_ELASTICACHE_ENDPOINT> -p 6380 --tls --cacert /etc/ssl/certs/aws-ca.pem
PING
INFO
exit
kubectl delete pod redis-cli
```
Note: Amazon Root CA (file AmazonRootCA1.pem) was downloaded from [https://www.amazontrust.com/repository/](https://www.amazontrust.com/repository/)

## Sixth step: Deploy drivers

Run
```
sh k8s/deploy.sh
kubectl --namespace=kube-system get pods -l "app.kubernetes.io/name=aws-cluster-autoscaler,app.kubernetes.io/instance=cluster-autoscaler"

#kubectl apply -f k8s/csi-cluster-role.yml
#kubectl apply -f k8s/csi-cluster-rolebinding.yml
#kubectl apply -f k8s/csi-secret-role.yml
#kubectl apply -f k8s/csi-secret-rolebinding.yml

sh generateSecretProviderClass.sh
kubectl apply -f .tmp/secretProviderClass.yml
kubectl get secret aws-secrets
kubectl describe secret aws-secrets
```

## Seventh step: Deploy Datadog monitoring

Setup an account first and set values in .datadog file (copy/paste and rename .datadog.example)
- DATADOG_API_KEY from [https://us5.datadoghq.com/organization-settings/api-keys](https://us5.datadoghq.com/organization-settings/api-keys)
- DATADOG_APP_KUBERNETES_KEY create one at [https://us5.datadoghq.com/personal-settings/application-keys](https://us5.datadoghq.com/personal-settings/application-keys)
- DATADOG_SITE is the https site URL

Run
```
setupDatadog.sh
```

Test
```
kubectl logs -l app=datadog -c agent
```
Also have a look at (replace <site> with yours) [https://site.datadoghq.com/organization-settings/remote-config/capabilities](https://site.datadoghq.com/organization-settings/remote-config/capabilities)

Import dashboard datadog-dashboard-performance.json

## Eigth step: Deploy application

Run
```
sh generateSequencerConfigmap.sh
kubectl apply -f .tmp/sequencer-configmap.yml
kubectl apply -f k8s/adminwebportal-deployment.yml
kubectl apply -f k8s/processorwebservice-deployment.yml
kubectl apply -f k8s/sequencerwebservice-deployment.yml
kubectl apply -f k8s/adminwebportal-service.yml
kubectl apply -f k8s/adminwebportal-loadbalancer.yml
```

Test locally
```
kubectl port-forward service/adminwebportal 8080:80
curl http://localhost:8080/
curl -s --raw --show-error --verbose -L -X GET http://localhost:8080/
curl -X GET http://localhost:8080/healthz
curl -X GET http://localhost:8080/healthc
curl -X GET http://localhost:8080/healthd
```
More endpoints with payloads available at [AdminWebPortal/NOTES.md](https://github.com/Ducharme/sequencer/blob/main/WebServices/AdminWebPortal/NOTES.md)

To list resources
```
k get po && k get ds && k get rs && k get cm && k get secret && k get deploy && k get svc && k get statefulsets
```

## Nineth step: Load test

Edit ENV VAR values on top of testAll.sh file (first 2 blocks)

Run
```
sh resetTest.sh
sh testAll.sh
```

PROCESSING_DELAY_MS=0
To keep logs you can send output to a file for record. naming below is the R#, NB_MESSAGES, CREATION_DELAY_MS, number of AdminWebPortal, NB_PROCESSORS, NB_SEQUENCERS, number and type of EC2, Redis ECPUs
```
mkdir -p .tmp/perfs
sh testAll.sh > .tmp/perfs/R25-60000_0_0-1_10_3-3ec2c7xl-100000ecpu.log
```
