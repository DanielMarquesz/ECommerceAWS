import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb';


export class EventsDdbStack extends cdk.Stack {
  readonly table: dynamo.Table

  constructor(scope: Construct, id: string, props?:cdk.StackProps) {
    super(scope, id, props)

    this.table = new dynamo.Table(this, "EventsDdb", {
      tableName: 'events',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: "pk",
        type: dynamo.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: dynamo.AttributeType.STRING
      },
      timeToLiveAttribute: 'ttl',
      billingMode: cdk.aws_dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    },)
  }
}