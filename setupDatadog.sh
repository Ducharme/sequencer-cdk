#!/bin/sh

. setDatadogEnvVars.sh

kubectl delete secret datadog-api-secret
kubectl delete secret datadog-app-kubernetes-secret

# From https://us5.datadoghq.com/organization-settings/api-keys
kubectl create secret generic datadog-api-secret --from-literal=api-key=$DATADOG_API_KEY
# Create one at https://us5.datadoghq.com/personal-settings/application-keys
kubectl create secret generic datadog-app-kubernetes-secret --from-literal=app-key=$DATADOG_APP_KUBERNETES_KEY

helm repo add datadog https://helm.datadoghq.com
helm repo update

helm install datadog datadog/datadog -f datadog-values.yml --set datadog.site=$DATADOG_SITE
#kubectl logs -l app=datadog -c agent
#helm uninstall datadog
