import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'

export class AuroraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC and Subnet
    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c'],
      natGatewayProvider: ec2.NatProvider.instance({
        instanceType: new ec2.InstanceType('t2.nano')
      }),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    })

    const subnetGroup = new rds.SubnetGroup(this, 'SubnetGroup', {
      vpc,
      description: "RdsSubnetGroup",
      subnetGroupName: 'RdsSubnetGroup',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }
    })

    // aurora
    new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_7
      }),
      vpc,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      serverlessV2MaxCapacity: 1,
      serverlessV2MinCapacity: 0.5,
      subnetGroup
    })
  }
}
