import { Construct } from 'constructs';
import { CfnJson, CfnOutput, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { KubectlV30Layer } from '@aws-cdk/lambda-layer-kubectl-v30';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';

interface EksStackProps extends StackProps {
  vpc: ec2.Vpc;
}

export class EksStack extends Stack {
  public readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props: EksStackProps) {
    super(scope, id, props);

    const clusterRole = new iam.Role(this, 'SequencerEksClusterRole', {
        assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSVPCResourceController'),
        ],
    });

    const mastersRole =new iam.Role(this, 'SequencerEksMastersRole', {
        assumedBy: new iam.AccountRootPrincipal(),
    });

    // TODO: Creation of a launch template is needed to enable IMDSv2 and disable IMDSv1
    // https://aws.amazon.com/blogs/security/get-the-full-benefits-of-imdsv2-and-disable-imdsv1-across-your-aws-infrastructure/
    this.cluster = new eks.Cluster(this, 'SequencerEksCluster', {
      vpc: props.vpc,
      version: eks.KubernetesVersion.V1_30,
      kubectlLayer: new KubectlV30Layer(this, 'SequencerKubectlLayer'),
      authenticationMode: eks.AuthenticationMode.API_AND_CONFIG_MAP,
      defaultCapacityInstance: new ec2.InstanceType('c7i.xlarge'),
      defaultCapacity: 3,
      mastersRole: mastersRole,
      role: clusterRole
    });
    new CfnOutput(this, 'EksClusterName', {
      value: this.cluster.clusterName ?? "",
      description: 'EKS Cluster Name',
    });

    // Datadog ports https://docs.datadoghq.com/agent/guide/agent-5-ports/
    const clusterSecurityGroup = this.cluster.clusterSecurityGroup;
    // Add ingress rules for Datadog Agent browser GUI
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5002),
      'Allow TCP port 5002 for Datadog Agent browser GUI'
    );
    // Add ingress rules for Datadog Tracing and Profiler
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(8126),
      'Allow TCP port 8126 for Datadog Tracing and Profiler'
    );
    // NOTE: Mentions UDP https://github.com/DataDog/helm-charts/blob/main/charts/datadog/values.yaml
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.udp(8126),
      'Allow UDP port 8126 for Datadog Tracing and Profiler'
    );
    // Add ingress rules for Datadog monitoring with dogstatsd
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.udp(8125),
      'Allow UDP port 8125 for dogstatsd'
    );
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(8125),
      'Allow TCP port 8125 for dogstatsd'
    );
    // Add ingress rules for Datadog Inter Process Communication (IPC)
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5001),
      'Allow TCP port 5001 for Datadog IPC'
    );
    // Add ingress rules for Datadog Process Agent debug	
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6062),
      'Allow TCP port 6062 for Datadog Process Agent debug'
    );
    // Add ingress rules for Datadog Process Agent runtime
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6162),
      'Allow TCP port 6162 for Datadog Process Agent runtime'
    );
    // Add ingress rules for Datadog Container Agent healthz endpoint
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5555),
      'Allow TCP port 5555 for Datadog Container Agent healthz endpoint'
    );
    // Add ingress rules for Datadog Agent GUI in DEBUG
    clusterSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5000),
      'Allow TCP port 5000 for Datadog Agent GUI in DEBUG'
    );

    // Configure the default node group
    const defaultNodeGroup = this.cluster.defaultNodegroup;
    if (defaultNodeGroup) {
      const cfnNodeGroup = defaultNodeGroup.node.defaultChild as eks.CfnNodegroup;
      cfnNodeGroup.scalingConfig = { minSize: 0, maxSize: 6, desiredSize: 3 };
      cfnNodeGroup.updateConfig = { maxUnavailable: 1 };
      cfnNodeGroup.capacityType = eks.CapacityType.SPOT;
      cfnNodeGroup.tags.setTag('k8s.io/cluster-autoscaler/enabled', "true");
      const clusterName = new CfnJson(this, 'ClusterName', {
        value: `k8s.io/cluster-autoscaler/${this.cluster.clusterName}`,
      });
      cfnNodeGroup.tags.setTag(clusterName.toString(), 'owned');
    }

    const podExecutionRole = new iam.Role(this, 'SequencerPodExecutionRole', {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonElastiCacheFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSFullAccess'),
      ],
    });
    podExecutionRole.addToPolicy(new iam.PolicyStatement({
        sid: 'PodSecretsManagerGetSecretValuePolicy',
        effect: iam.Effect.ALLOW,
        actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret'
        ],
        resources: ['*'],
    }));

    const podServiceAccountName = 'sequencer-pod-service-account';
    const podServiceAccount = this.cluster.addServiceAccount('SequencerPodServiceAccount', {
      name: podServiceAccountName,
      namespace: 'default',
      annotations: {
        'eks.amazonaws.com/role-arn': podExecutionRole.roleArn
      }
    });
    podServiceAccount.role.attachInlinePolicy(new iam.Policy(this, 'SequencerPodAccessPolicy', {
        statements: [
          new iam.PolicyStatement({
            actions: ['elasticache:*', 'rds:*', 'secretsmanager:GetSecretValue'],
            resources: ['*'],
          }),
        ],
    }));
    podServiceAccount.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'));

     // Create the OpenIdConnectPrincipal
    const openIdConnectProvider = this.cluster.openIdConnectProvider;
    const oidcPrincipal = new iam.OpenIdConnectPrincipal(openIdConnectProvider);
    const conditions = {
        StringEquals: new CfnJson(this, 'OpenIdConditionJsonPodServiceAccount', {
            value: {
              [`${openIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
              [`${openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: `system:serviceaccount:default:${podServiceAccountName}`
            },
        }),
    };
    const assumeRolePolicyStatement = new iam.PolicyStatement({
        actions: ['sts:AssumeRoleWithWebIdentity'],
        effect: iam.Effect.ALLOW,
        principals: [oidcPrincipal],
        conditions: conditions,
    });
    podExecutionRole.assumeRolePolicy?.addStatements(assumeRolePolicyStatement);

    const clusterAutoscalerRoleName = "cluster-autoscaler";
    const autoScalerPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeTags",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeLaunchTemplateVersions",
        "ec2:DescribeInstanceTypes"
      ],
      resources: ["*"]
    });
    if (this.cluster.defaultNodegroup) {
      const nodeGroupRole = this.cluster.defaultNodegroup.role;
      nodeGroupRole.addToPrincipalPolicy(autoScalerPolicy);
    }
    const clusterAutoscalerRole = new iam.Role(this, 'SequencerEksClusterAutoscalerRole', {
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSVPCResourceController'),
      ],
    });
    clusterAutoscalerRole.addToPrincipalPolicy(autoScalerPolicy);
    const conditions2 = {
      StringEquals: new CfnJson(this, 'OpenIdConditionJsonClusterAutoscalerRole', {
          value: {
            [`${openIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
            [`${openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: `system:serviceaccount:kube-system:${clusterAutoscalerRoleName}`
          },
      }),
    };
    const assumeRolePolicyStatement2 = new iam.PolicyStatement({
        actions: ['sts:AssumeRoleWithWebIdentity'],
        effect: iam.Effect.ALLOW,
        principals: [oidcPrincipal],
        conditions: conditions2,
    });
    clusterAutoscalerRole.assumeRolePolicy?.addStatements(assumeRolePolicyStatement2);
    new CfnOutput(this, 'ClusterAutoscalerRoleName', {
      value: clusterAutoscalerRoleName,
      description: 'Cluster Autoscaler Role Name',
    });
    new CfnOutput(this, 'ClusterAutoscalerRoleArn', {
      value: clusterAutoscalerRole.roleArn ?? "",
      description: 'Cluster Autoscaler Role ARN',
    });
  }
}
