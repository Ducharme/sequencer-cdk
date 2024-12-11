import { IConstruct } from 'constructs';
import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy, Aspects, IAspect, CfnResource } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { EC2 } from "@aws-sdk/client-ec2";

const region = process.env.AWS_REGION || "ap-southeast-1";
const sdk_ec2 = new EC2({ region });

export class VpcStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'SequencerVPC', {
      availabilityZones: this.availabilityZones,
      createInternetGateway: true,
      natGateways: 1,
      vpcName: 'sequencer-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Add removal policies
    this.vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // Apply removal policy to all subnets
    for (const subnet of this.vpc.publicSubnets) {
      (subnet.node.defaultChild as CfnResource)?.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
    for (const subnet of this.vpc.privateSubnets) {
      (subnet.node.defaultChild as CfnResource)?.applyRemovalPolicy(RemovalPolicy.DESTROY);
    }
    // Apply removal policy to NAT gateways
    const cfnVpc = this.vpc.node.defaultChild as ec2.CfnVPC;
    cfnVpc.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Optional: Add aspect to ensure all VPC-related resources are destroyed
    this.addVpcDestroyAspect();
  }

  private addVpcDestroyAspect() {
    // Add an aspect to apply removal policy to all VPC-related resources
    class VpcResourcesRemovalAspect implements IAspect {
      public visit(node: IConstruct): void {
        if (
          node instanceof ec2.CfnVPC || 
          node instanceof ec2.CfnSubnet || 
          node instanceof ec2.CfnRouteTable || 
          node instanceof ec2.CfnNetworkAcl || 
          node instanceof ec2.CfnSecurityGroup ||
          node instanceof ec2.CfnNatGateway ||
          node instanceof ec2.CfnInternetGateway
        ) {
          node.applyRemovalPolicy(RemovalPolicy.DESTROY);
        }
      }
    }

    Aspects.of(this).add(new VpcResourcesRemovalAspect());
  }
}
