
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

## Docker

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
cdk bootstrap
cdk synth
```

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
Also have a look at (replace <site> with yours) [https://site.datadoghq.com/organization-settings/remote-config/capabilities](https://site.datadoghq.com/organization-settings/remote-config/capabilities)

Import dashboard datadog-dashboard-performance.json

Add AWS Account from Integration/Amazon Web Services (select to run the CloudFormation Stack) then enable EXTENDED RESOURCE COLLECTION for AWS cloud account under infrastructure/catalog/configuration.

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
