
# Pre-requisites

These instruction were tested on lubuntu 24.04. Before starting, it is highly recommended to upgrade the system with
```
sudo apt-get update
sudo apt-get upgrade
sudo apt-get dist-upgrade
```

## AWS user

Create an IAM user granted policy AdministratorAccess.

Under "Security credentials" tab, under "Access keys" section, click Create access key and save the file for later.


## curl zip unzip npm

cURL is a command-line tool for getting or sending data including files using URL syntax

```
sudo apt install curl zip unzip npm
```


## aws cli version 2

Follow [Installing or updating the latest version of the AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
```
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install --update
```

Then configure [Configuration basics for CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) using values from "new_user_credentials.csv" previously generated in AWS console.
```
aws configure
```
or set ENV VARS
```
export AWS_ACCESS_KEY=<VALUE>
export AWS_SECRET_ACCESS_KEY=<VALUE>
export AWS_SESSION_TOKEN=<VALUE>
```


## GitHub CLI

[Installing gh on Ubuntu Linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md#debian-ubuntu-linux-raspberry-pi-os-apt)
```
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```
Autenticate
```
gh auth login
```
Follow instructions for web browser


## Node.js

[Install & Update Script](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script)
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm list-remote --lts
nvm install v20.17.0
```


## AWS CDK Toolkit

```
npm install -g aws-cdk@latest
```


## kubectl

[Install and Set Up kubectl on Linux](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
```
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
kubectl version --client
```

## Helm

[Through Package Managers](https://helm.sh/docs/intro/install/#from-apt-debianubuntu)
```
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt update
sudo apt install helm
helm version
```

## Docker (optional for development)

Run docker without admin rights
[Docker engine install ubuntu](https://docs.docker.com/engine/install/ubuntu/)
[Docker engine postinstall ubuntu](https://docs.docker.com/engine/install/linux-postinstall/)


## Visual Code (optional for development)

[Download Visual Studio Code deb file](https://code.visualstudio.com/download) then follow [Debian and Ubuntu based distributions](https://code.visualstudio.com/docs/setup/linux#_debian-and-ubuntu-based-distributions)
```
sudo apt install ./<file>.deb
```


## Google Chrome (optional for development)

[Download 64 bit .deb (For Debian/Ubuntu)](https://www.google.com/chrome/) then follow execute
```
sudo apt install ./<file>.deb
```


# How To Deploy

Run below scripts (tested with Lubuntu 24.04 default terminal)

## First step: Download scripts locally (1 minute)

Clone the repository which contains all the scripts
```
git clone https://github.com/Ducharme/sequencer-cdk
```
Install dependecies
```
npm install
```

## Second step: Configure then run scripts locally (2 minutes)

Edit file [.env.poc](.env.poc) to set SERVERLESS value to "true" or "false" ("false" should be used for best performances). Once saved, run
```
cdk bootstrap
cdk synth
```
Note: You might need to append "aws://<AWS_ACCOUNT_ID>/<REGION>" for the bootstrap


## Third step: Deploy core infrastructure (3 + 17 + 11 minutes)

```
cdk deploy VpcStack
cdk deploy EksStack
cdk deploy RedisBaseStack
```

## Fourth step: Configure kubectl for AWS EKS cluster

Run this command (see next step for values)
```
aws eks update-kubeconfig --name <EKS_CLUSTER_NAME> --region <REGION> --role-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/EksStack-SequencerEksMastersRole<RANDOM>
```
To get the exact command, execute
```
aws cloudformation describe-stacks --stack-name EksStack --query "Stacks[0].Outputs[?contains(OutputKey, 'SequencerEksClusterConfigCommand')].OutputValue" --output text
```

Test kubectl
```
kubectl get nodes -v=10
```

Follow these steps [Playing with Kubernetes / Setup the environment](https://github.com/Ducharme/infraAsCodeCdk/tree/main?tab=readme-ov-file#setup-the-environment-once-eksctl-is-deployed)

## Fifth step: Test connectivity to Redis from EKS cluster

Run
```
ELASTICACHE_ENDPOINT=$(aws cloudformation describe-stacks --stack-name RedisServerlessStack --query "Stacks[0].Outputs[?contains(OutputKey, 'RedisEndpoint')].OutputValue" --output text)
or ELASTICACHE_ENDPOINT=$(aws cloudformation describe-stacks --stack-name RedisClusterStack --query "Stacks[0].Outputs[?contains(OutputKey, 'RedisEndpoint')].OutputValue" --output text)
kubectl create configmap aws-ca-cert --from-file=ca.pem=k8s/AmazonRootCA1.pem
kubectl apply -f k8s/redis-cli-pod.yml
kubectl wait --for=condition=Ready pod/redis-cli
kubectl exec -it redis-cli -- redis-cli -h $ELASTICACHE_ENDPOINT -p 6379 --tls --insecure
kubectl exec -it redis-cli -- redis-cli -h $ELASTICACHE_ENDPOINT -p 6379 --tls --cacert /etc/ssl/certs/aws-ca.pem
kubectl exec -it redis-cli -- redis-cli -h $ELASTICACHE_ENDPOINT -p 6380 --tls --cacert /etc/ssl/certs/aws-ca.pem
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
```
Check health
```
kubectl logs -n kube-system $(kubectl get pods -n kube-system | grep cluster-autoscaler-aws-cluster-autoscaler | awk '{print $1}')
kubectl logs -n kube-system $(kubectl get pods -n kube-system | grep secrets-store-csi-driver-provider-aws | awk '{print $1}')
kubectl logs -n kube-system $(kubectl get pods -n kube-system | grep csi-secrets-store-secrets-store-csi-driver | awk '{print $1}')
kubectl get events -n kube-system | grep secrets-store-csi-driver-provider-aws
```
Import aws-secrets with a busybox pod
```
sh generateSecretProviderClass.sh
```

## Seventh step: Deploy Datadog monitoring

Note: Datadog website address depends on the region selected (below links were using "us5", replavce with yours as needed)
- Subdomain can be "app" for US1-East, "us3" for US3-West, "us5" for US5-Central, "ap1" for AP1-Japan and Top-level domain will be "com"
- Subdomain will be "app" and Top-level domain will be "eu" for EU1-Europe

Setup an account first and set values in .datadog file (copy/paste and rename .datadog.example)
- DATADOG_API_KEY create one at [https://us5.datadoghq.com/organization-settings/api-keys](https://us5.datadoghq.com/organization-settings/api-keys) named "datadog-api-secret"
- DATADOG_APP_KUBERNETES_KEY create one at [https://us5.datadoghq.com/personal-settings/application-keys](https://us5.datadoghq.com/personal-settings/application-keys) named "datadog-app-kubernetes-secret"
- DATADOG_SITE is the https subdoimain of the site URL (could be app or us5 for example)

Run
```
sh setupDatadog.sh
```

Test
```
kubectl logs -l app=datadog -c agent
```
Also have a look at (replace <site> with yours) [https://us5.datadoghq.com/organization-settings/remote-config/capabilities](https://site.datadoghq.com/organization-settings/remote-config/capabilities)

Import dashboard [datadog-dashboard-performance.json](datadog-dashboard-performance.json)

Add AWS Account from Integration/Amazon Web Services (select to run the CloudFormation Stack) then enable EXTENDED RESOURCE COLLECTION for AWS cloud account under infrastructure/catalog/configuration.

Follow instructions to [Setup log pipelines](DATADOG.md#setup-log-pipelines)

## Eigth step: Deploy application

Run
```
sh generateSequencerConfigmap.sh
kubectl apply -f .tmp/sequencer-configmap.yml
kubectl apply -f k8s/processorwebservice-deployment.yml
kubectl apply -f k8s/sequencerwebservice-deployment.yml
kubectl apply -f k8s/adminwebportal-deployment.yml
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
sh k8s/list-resources.sh
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

Datadog log filters for processing
```
service:processorwebservice ("1:poc;" OR "60000:poc;")
```
Datadog log filters for processing
```
service:sequencerwebservice ("with sequence id 1 to" OR "with sequence id 60000 to")
```
Datadog log filters for processing & sequencing
```
(service:processorwebservice AND "contains message 1:poc;") OR (service:sequencerwebservice AND "with sequence id 60000 to")
```


ALL -- Stats from 1 to 60000
```json
{"start":1,"count":60000,"stats":{"createdToProcessingStats":{"50p":3198,"90p":5284,"95p":5469,"99p":5845,"avg":3197.75,"min":469,"max":5881},"processingToProcessedStats":{"50p":8,"90p":18,"95p":29,"99p":169.01,"avg":13.06,"min":1,"max":250},"processedToSequencingStats":{"50p":481,"90p":725,"95p":779,"99p":856,"avg":482.67,"min":47,"max":1026},"sequencingToSavedStats":{"50p":17,"90p":34,"95p":43,"99p":43,"avg":18.55,"min":2,"max":43},"savedToSequencedStats":{"50p":0,"90p":1,"95p":8,"99p":8,"avg":0.8,"min":0,"max":8},"processingToSequencedStats":{"50p":512,"90p":751,"95p":809,"99p":1009,"avg":515.08,"min":95,"max":1048},"createdToSequencedStats":{"50p":3787,"90p":5868,"95p":5869,"99p":6236,"avg":3712.83,"min":715,"max":6236},"maxCreatedToProcessingSeq":{"max":5881,"seq":59998},"maxProcessingToProcessedSeq":{"max":250,"seq":57491},"maxProcessedToSequencingSeq":{"max":1026,"seq":41047},"maxSequencingToSavedSeq":{"max":43,"seq":9340},"maxSavedToSequencedSeq":{"max":8,"seq":9340},"maxProcessingToSequencedSeq":{"max":1048,"seq":41074},"maxCreatedToSequencedSeq":{"max":6236,"seq":57451},"minCreatedToProcessingSeq":{"min":469,"seq":1},"minProcessingToProcessedSeq":{"min":1,"seq":12536},"minProcessedToSequencingSeq":{"min":47,"seq":742},"minSequencingToSavedSeq":{"min":2,"seq":57451},"minSavedToSequencedSeq":{"min":0,"seq":743},"minProcessingToSequencedSeq":{"min":95,"seq":742},"minCreatedToSequencedSeq":{"min":715,"seq":1}},"check":{"firstSeq":1,"lastSeq":60000,"isOrdered":true,"brokenAfter":null,"brokenSeq":null,"others":[]}}
```
ALL -- Perfs from 1 to 60000
```json
{"start":1,"count":60000,"perfs":{"processingRatePerSecond":{"0":10305,"1":11024,"2":12450,"3":10101,"4":13035,"5":3085},"sequencingRatePerSecond":{"0":4673,"1":9012,"2":14147,"3":13213,"4":8451,"5":10504},"processingRatePerSecondStats":{"50p":10664.5,"90p":12742.5,"95p":12888.75,"99p":13005.75,"avg":10000,"min":3085,"max":13035},"sequencingRatePerSecondStats":{"50p":9758,"90p":13680,"95p":13913.5,"99p":14100.3,"avg":10000,"min":4673,"max":14147},"averageRatePerSecond":10395.010395010395}}
```

# How To Destroy

Note the following command will not detect dependencies properly and will fail
```
cdk destroy --all --force
```

## Option 1: One by one with CDK
```
kubectl delete -f k8s/adminwebportal-loadbalancer.yml
aws cloudformation delete-stack --stack-name DatadogIntegration
cdk destroy RedisClusterStack
cdk destroy RedisBaseStack
cdk destroy EksStack
cdk destroy VpcStack
```

## Option 2: One by one with CloudFormation
```
kubectl delete -f k8s/adminwebportal-loadbalancer.yml
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[].{Name:StackName,Status:StackStatus,Updated:LastUpdatedTime}' --output table
aws cloudformation delete-stack --stack-name DatadogIntegration && aws cloudformation wait stack-delete-complete --stack-name DatadogIntegration
aws cloudformation delete-stack --stack-name RedisClusterStack
aws cloudformation delete-stack --stack-name RedisBaseStack
aws cloudformation delete-stack --stack-name EksStack
aws cloudformation delete-stack --stack-name VpcStack
```

## Issues

In case VpcStack fails to be deleted because of used ENI by ELB or other reasons, run
```
sh delete_vpc_dependencies.sh
```
