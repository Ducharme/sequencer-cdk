#!/bin/sh

# Set your AWS region and cluster name
REGION=$(aws configure get region)
CLUSTER_NAME=$(aws eks list-clusters --query "clusters[]" | grep "sequencer" | tr -d '" \t')

# Get the current user's ARN
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)

# Get the current aws-auth ConfigMap
TMPFILE=$(mktemp)
kubectl get configmap aws-auth -n kube-system -o yaml > "$TMPFILE"

# Check if the user is already in the aws-auth ConfigMap
if grep -q "$USER_ARN" "$TMPFILE"; then
    echo "User $USER_ARN already exists in aws-auth ConfigMap. Updating..."
    sed -i.bak "/$USER_ARN/,/username/c\    - rolearn: $USER_ARN\n      username: admin\n      groups:\n        - system:masters" "$TMPFILE"
else
    echo "User $USER_ARN not found in aws-auth ConfigMap. Adding..."
    sed -i.bak "/mapUsers: |/a\    - rolearn: $USER_ARN\n      username: admin\n      groups:\n        - system:masters" "$TMPFILE"
fi

# Apply the updated ConfigMap
kubectl apply -f "$TMPFILE"

# Clean up
rm "$TMPFILE" "$TMPFILE.bak"

echo "aws-auth ConfigMap updated successfully."

# Update kubeconfig
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"

echo "kubeconfig updated. You should now have access to the cluster."
