#!/bin/sh

TAG_KEY="kubernetes.io/service-name"
TAG_VALUE="default/adminwebportal-lb"

# First check and delete ELBs
printf "Checking for Load Balancers...\n"

# Check Classic ELBs
CLASSIC_LBS=$(aws elb describe-load-balancers --query 'LoadBalancerDescriptions[].LoadBalancerName' --output text)

for lb in $CLASSIC_LBS; do
  TAGS=$(aws elb describe-tags --load-balancer-names "$lb" --query "TagDescriptions[].Tags[?Key=='${TAG_KEY}' && Value=='${TAG_VALUE}'].Value" --output text)
  
  if [ ! -z "$TAGS" ]; then
    printf "Found matching Classic ELB: %s\n" "$lb"
    printf "Deleting Classic ELB: %s\n" "$lb"
    aws elb delete-load-balancer --load-balancer-name "$lb"
    if [ $? -eq 0 ]; then
      printf "Successfully deleted Classic ELB: %s\n" "$lb"
    else
      printf "Failed to delete Classic ELB: %s\n" "$lb"
    fi
  fi
done

# Delete Security Groups
printf "Checking Security Groups...\n"
SEC_GROUPS=$(aws ec2 describe-security-groups --filters "Name=tag-key,Values=kubernetes.io/cluster/SequencerEksCluster*" --query 'SecurityGroups[*].GroupId' --output text)
for sg in $SEC_GROUPS; do
  printf "Deleting Security Group: %s\n" "$sg"
  aws ec2 delete-security-group --group-id "$sg"
done

# Then proceed with subnet deletion
printf "\nFound these sequencer-related subnets:\n"
aws ec2 describe-subnets --filters "Name=tag:Project,Values=*sequencer*" --query 'Subnets[].SubnetId' --output table
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=tag:Project,Values=*sequencer*" --query 'Subnets[].SubnetId' --output text)
for subnet in $SUBNET_IDS
do
    printf "\nChecking dependencies for subnet: %s\n" "$subnet"
    
    # Check for ENIs
    ENIS=$(aws ec2 describe-network-interfaces --filters "Name=subnet-id,Values=$subnet" --query 'NetworkInterfaces[].NetworkInterfaceId' --output text)
    
    if [ ! -z "$ENIS" ]; then
    printf "Found Network Interfaces: %s\n" "$ENIS"
    printf "Attempting to delete network interfaces...\n"
    for eni in $ENIS; do
        aws ec2 delete-network-interface --network-interface-id "$eni"
        if [ $? -eq 0 ]; then
        printf "Deleted network interface: %s\n" "$eni"
        else
        printf "Failed to delete network interface: %s\n" "$eni"
        fi
    done
    fi
    
    printf "Attempting to delete subnet: %s\n" "$subnet"
    aws ec2 delete-subnet --subnet-id "$subnet"
    if [ $? -eq 0 ]; then
    printf "Successfully deleted subnet: %s\n" "$subnet"
    else
    printf "Failed to delete subnet: %s\n" "$subnet"
    fi
done
