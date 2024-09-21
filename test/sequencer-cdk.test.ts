import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack', () => {
  let app: App;
  let stack: VpcStack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new VpcStack(app, 'TestVpcStack');
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct properties', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: 'default',
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Name', Value: 'sequencer-vpc' }),
      ]),
    });
  });

  test('Internet Gateway is created', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  });

  test('NAT Gateway is created', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('Correct number of subnets are created', () => {
    const availabilityZones = stack.availabilityZones.length;
    template.resourceCountIs('AWS::EC2::Subnet', availabilityZones * 2); // 2 subnet types
  });

  test('Check for route to NAT Gateway', () => {
    template.hasResourceProperties('AWS::EC2::Route', Match.objectLike({
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: Match.anyValue(),
      RouteTableId: Match.anyValue(),
    }));
  });

  test('NAT Gateway is associated with a public subnet', () => {
    template.hasResourceProperties('AWS::EC2::NatGateway', Match.objectLike({
      AllocationId: Match.anyValue(),
      SubnetId: Match.anyValue(),
    }));
  });

  /*test('Public subnets are created with correct properties', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
      MapPublicIpOnLaunch: true,
      Tags: Match.arrayWith([
        { Key: 'aws:cloudformation:stack-name', Value: 'VpcStack' },
        { Key: 'aws-cdk:subnet-name', Value: 'Public' },
        { Key: 'aws-cdk:subnet-type', Value: 'Public' },
      ]),
    }));
  });

  test('Private subnets are created with correct properties', () => {
    template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
      MapPublicIpOnLaunch: false,
      Tags: Match.arrayWith([
        { Key: 'aws:cloudformation:stack-name', Value: 'VpcStack' },
        { Key: 'aws-cdk:subnet-name', Value: 'Private' },
        { Key: 'aws-cdk:subnet-type', Value: 'Private' },
      ]),
    }));
  });*/

  test('Each subnet has a route table association', () => {
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 
      stack.availabilityZones.length * 2); // 2 subnet types
  });

  test('Route tables are created for subnets', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 4); // 1 per AZ + 1 for the VPC
  });
});