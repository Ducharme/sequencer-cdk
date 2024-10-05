"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const assertions_1 = require("aws-cdk-lib/assertions");
const vpc_stack_1 = require("../lib/vpc-stack");
describe('VpcStack', () => {
    let app;
    let stack;
    let template;
    beforeEach(() => {
        app = new aws_cdk_lib_1.App();
        stack = new vpc_stack_1.VpcStack(app, 'TestVpcStack');
        template = assertions_1.Template.fromStack(stack);
    });
    test('VPC is created with correct properties', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.0.0.0/16',
            EnableDnsHostnames: true,
            EnableDnsSupport: true,
            InstanceTenancy: 'default',
            Tags: assertions_1.Match.arrayWith([
                assertions_1.Match.objectLike({ Key: 'Name', Value: 'sequencer-vpc' }),
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
        template.hasResourceProperties('AWS::EC2::Route', assertions_1.Match.objectLike({
            DestinationCidrBlock: '0.0.0.0/0',
            NatGatewayId: assertions_1.Match.anyValue(),
            RouteTableId: assertions_1.Match.anyValue(),
        }));
    });
    test('NAT Gateway is associated with a public subnet', () => {
        template.hasResourceProperties('AWS::EC2::NatGateway', assertions_1.Match.objectLike({
            AllocationId: assertions_1.Match.anyValue(),
            SubnetId: assertions_1.Match.anyValue(),
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
        template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', stack.availabilityZones.length * 2); // 2 subnet types
    });
    test('Route tables are created for subnets', () => {
        template.resourceCountIs('AWS::EC2::RouteTable', 4); // 1 per AZ + 1 for the VPC
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VxdWVuY2VyLWNkay50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VxdWVuY2VyLWNkay50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQWtDO0FBQ2xDLHVEQUF5RDtBQUN6RCxnREFBNEM7QUFFNUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFDeEIsSUFBSSxHQUFRLENBQUM7SUFDYixJQUFJLEtBQWUsQ0FBQztJQUNwQixJQUFJLFFBQWtCLENBQUM7SUFFdkIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQztRQUNoQixLQUFLLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUMxQyxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1FBQ2xELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxlQUFlLEVBQUU7WUFDOUMsU0FBUyxFQUFFLGFBQWE7WUFDeEIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGVBQWUsRUFBRSxTQUFTO1lBQzFCLElBQUksRUFBRSxrQkFBSyxDQUFDLFNBQVMsQ0FBQztnQkFDcEIsa0JBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsQ0FBQzthQUMxRCxDQUFDO1NBQ0gsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1FBQ3ZDLFFBQVEsQ0FBQyxlQUFlLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1FBQ2xDLFFBQVEsQ0FBQyxlQUFlLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO1FBQ2pELE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQztRQUN6RCxRQUFRLENBQUMsZUFBZSxDQUFDLGtCQUFrQixFQUFFLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCO0lBQ3hGLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtRQUMxQyxRQUFRLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUUsa0JBQUssQ0FBQyxVQUFVLENBQUM7WUFDakUsb0JBQW9CLEVBQUUsV0FBVztZQUNqQyxZQUFZLEVBQUUsa0JBQUssQ0FBQyxRQUFRLEVBQUU7WUFDOUIsWUFBWSxFQUFFLGtCQUFLLENBQUMsUUFBUSxFQUFFO1NBQy9CLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO1FBQzFELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxzQkFBc0IsRUFBRSxrQkFBSyxDQUFDLFVBQVUsQ0FBQztZQUN0RSxZQUFZLEVBQUUsa0JBQUssQ0FBQyxRQUFRLEVBQUU7WUFDOUIsUUFBUSxFQUFFLGtCQUFLLENBQUMsUUFBUSxFQUFFO1NBQzNCLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQyxDQUFDLENBQUM7SUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0FvQks7SUFFTCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1FBQ3JELFFBQVEsQ0FBQyxlQUFlLENBQUMsdUNBQXVDLEVBQzlELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7SUFDMUQsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1FBQ2hELFFBQVEsQ0FBQyxlQUFlLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQywyQkFBMkI7SUFDbEYsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFRlbXBsYXRlLCBNYXRjaCB9IGZyb20gJ2F3cy1jZGstbGliL2Fzc2VydGlvbnMnO1xuaW1wb3J0IHsgVnBjU3RhY2sgfSBmcm9tICcuLi9saWIvdnBjLXN0YWNrJztcblxuZGVzY3JpYmUoJ1ZwY1N0YWNrJywgKCkgPT4ge1xuICBsZXQgYXBwOiBBcHA7XG4gIGxldCBzdGFjazogVnBjU3RhY2s7XG4gIGxldCB0ZW1wbGF0ZTogVGVtcGxhdGU7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgYXBwID0gbmV3IEFwcCgpO1xuICAgIHN0YWNrID0gbmV3IFZwY1N0YWNrKGFwcCwgJ1Rlc3RWcGNTdGFjaycpO1xuICAgIHRlbXBsYXRlID0gVGVtcGxhdGUuZnJvbVN0YWNrKHN0YWNrKTtcbiAgfSk7XG5cbiAgdGVzdCgnVlBDIGlzIGNyZWF0ZWQgd2l0aCBjb3JyZWN0IHByb3BlcnRpZXMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6VlBDJywge1xuICAgICAgQ2lkckJsb2NrOiAnMTAuMC4wLjAvMTYnLFxuICAgICAgRW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgICAgRW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgIEluc3RhbmNlVGVuYW5jeTogJ2RlZmF1bHQnLFxuICAgICAgVGFnczogTWF0Y2guYXJyYXlXaXRoKFtcbiAgICAgICAgTWF0Y2gub2JqZWN0TGlrZSh7IEtleTogJ05hbWUnLCBWYWx1ZTogJ3NlcXVlbmNlci12cGMnIH0pLFxuICAgICAgXSksXG4gICAgfSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0ludGVybmV0IEdhdGV3YXkgaXMgY3JlYXRlZCcsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6RUMyOjpJbnRlcm5ldEdhdGV3YXknLCAxKTtcbiAgfSk7XG5cbiAgdGVzdCgnTkFUIEdhdGV3YXkgaXMgY3JlYXRlZCcsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6RUMyOjpOYXRHYXRld2F5JywgMSk7XG4gIH0pO1xuXG4gIHRlc3QoJ0NvcnJlY3QgbnVtYmVyIG9mIHN1Ym5ldHMgYXJlIGNyZWF0ZWQnLCAoKSA9PiB7XG4gICAgY29uc3QgYXZhaWxhYmlsaXR5Wm9uZXMgPSBzdGFjay5hdmFpbGFiaWxpdHlab25lcy5sZW5ndGg7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkVDMjo6U3VibmV0JywgYXZhaWxhYmlsaXR5Wm9uZXMgKiAyKTsgLy8gMiBzdWJuZXQgdHlwZXNcbiAgfSk7XG5cbiAgdGVzdCgnQ2hlY2sgZm9yIHJvdXRlIHRvIE5BVCBHYXRld2F5JywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFQzI6OlJvdXRlJywgTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICBEZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICBOYXRHYXRld2F5SWQ6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgICBSb3V0ZVRhYmxlSWQ6IE1hdGNoLmFueVZhbHVlKCksXG4gICAgfSkpO1xuICB9KTtcblxuICB0ZXN0KCdOQVQgR2F0ZXdheSBpcyBhc3NvY2lhdGVkIHdpdGggYSBwdWJsaWMgc3VibmV0JywgKCkgPT4ge1xuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpFQzI6Ok5hdEdhdGV3YXknLCBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgIEFsbG9jYXRpb25JZDogTWF0Y2guYW55VmFsdWUoKSxcbiAgICAgIFN1Ym5ldElkOiBNYXRjaC5hbnlWYWx1ZSgpLFxuICAgIH0pKTtcbiAgfSk7XG5cbiAgLyp0ZXN0KCdQdWJsaWMgc3VibmV0cyBhcmUgY3JlYXRlZCB3aXRoIGNvcnJlY3QgcHJvcGVydGllcycsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6RUMyOjpTdWJuZXQnLCBNYXRjaC5vYmplY3RMaWtlKHtcbiAgICAgIE1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICBUYWdzOiBNYXRjaC5hcnJheVdpdGgoW1xuICAgICAgICB7IEtleTogJ2F3czpjbG91ZGZvcm1hdGlvbjpzdGFjay1uYW1lJywgVmFsdWU6ICdWcGNTdGFjaycgfSxcbiAgICAgICAgeyBLZXk6ICdhd3MtY2RrOnN1Ym5ldC1uYW1lJywgVmFsdWU6ICdQdWJsaWMnIH0sXG4gICAgICAgIHsgS2V5OiAnYXdzLWNkazpzdWJuZXQtdHlwZScsIFZhbHVlOiAnUHVibGljJyB9LFxuICAgICAgXSksXG4gICAgfSkpO1xuICB9KTtcblxuICB0ZXN0KCdQcml2YXRlIHN1Ym5ldHMgYXJlIGNyZWF0ZWQgd2l0aCBjb3JyZWN0IHByb3BlcnRpZXMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkVDMjo6U3VibmV0JywgTWF0Y2gub2JqZWN0TGlrZSh7XG4gICAgICBNYXBQdWJsaWNJcE9uTGF1bmNoOiBmYWxzZSxcbiAgICAgIFRhZ3M6IE1hdGNoLmFycmF5V2l0aChbXG4gICAgICAgIHsgS2V5OiAnYXdzOmNsb3VkZm9ybWF0aW9uOnN0YWNrLW5hbWUnLCBWYWx1ZTogJ1ZwY1N0YWNrJyB9LFxuICAgICAgICB7IEtleTogJ2F3cy1jZGs6c3VibmV0LW5hbWUnLCBWYWx1ZTogJ1ByaXZhdGUnIH0sXG4gICAgICAgIHsgS2V5OiAnYXdzLWNkazpzdWJuZXQtdHlwZScsIFZhbHVlOiAnUHJpdmF0ZScgfSxcbiAgICAgIF0pLFxuICAgIH0pKTtcbiAgfSk7Ki9cblxuICB0ZXN0KCdFYWNoIHN1Ym5ldCBoYXMgYSByb3V0ZSB0YWJsZSBhc3NvY2lhdGlvbicsICgpID0+IHtcbiAgICB0ZW1wbGF0ZS5yZXNvdXJjZUNvdW50SXMoJ0FXUzo6RUMyOjpTdWJuZXRSb3V0ZVRhYmxlQXNzb2NpYXRpb24nLCBcbiAgICAgIHN0YWNrLmF2YWlsYWJpbGl0eVpvbmVzLmxlbmd0aCAqIDIpOyAvLyAyIHN1Ym5ldCB0eXBlc1xuICB9KTtcblxuICB0ZXN0KCdSb3V0ZSB0YWJsZXMgYXJlIGNyZWF0ZWQgZm9yIHN1Ym5ldHMnLCAoKSA9PiB7XG4gICAgdGVtcGxhdGUucmVzb3VyY2VDb3VudElzKCdBV1M6OkVDMjo6Um91dGVUYWJsZScsIDQpOyAvLyAxIHBlciBBWiArIDEgZm9yIHRoZSBWUENcbiAgfSk7XG59KTsiXX0=