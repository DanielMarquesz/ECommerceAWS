import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs'
import * as cdk from 'aws-cdk-lib'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as sns from "aws-cdk-lib/aws-sns"
import * as subs from "aws-cdk-lib/aws-sns-subscriptions"
import * as iam from "aws-cdk-lib/aws-iam"
import { Construct } from 'constructs'


interface OrdersAppStackProps extends cdk.StackProps {
  productsDdb: dynamodb.Table,
  eventsDdb: dynamodb.Table
}

export class OrdersAppStack extends cdk.Stack {
  // Expose the lambda to another resource stacks
  readonly ordersHandler: lambdaNodeJS.NodejsFunction

  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props)

    const ordersDdb = new dynamodb.Table(this, "OrdersDdb", {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    })

    // Orders Layer
    const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersLayerVersionArn')    
    const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersLayerVersionArn", ordersLayerArn)

    const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersApiLayerVersionArn')
    const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersApiLayerVersionArn", ordersApiLayerArn)

    // Orders event Layer
    const orderEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersEventsLayerVersionArn')
    const ordersEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrdersEventsLayerVersionArn", orderEventsLayerArn)

    // Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn')
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayerVersionArn", productsLayerArn)

    // Order events Repository Layer
    const orderEventsRepositoryLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrderEventsRepositoryLayerVersionArn')
    const orderEventsRepositoryLayer = lambda.LayerVersion.fromLayerVersionArn(this, "OrderEventsRepositoryLayerVersionArn", orderEventsRepositoryLayerArn)

    const ordersTopic = new sns.Topic(this, "OrderEventsTopic", {
      displayName: "ORder events topic",
      topicName: "order-events"
    })

    // Function Handler
    this.ordersHandler = new lambdaNodeJS.NodejsFunction(this, "OrdersFunction",{
      functionName: "OrdersFunction",
      entry: "lambda/orders/ordersFunction.ts",
      handler: "handler",
      memorySize: 256,
      timeout: cdk.Duration.seconds(2),
      runtime: lambda.Runtime.NODEJS_20_X,
      layers: [productsLayer, ordersLayer, ordersApiLayer, ordersEventsLayer],
      bundling: {
        minify: true,
        sourceMap: false,
      },
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,      
      environment: {
        PRODUCTS_DDB: props.productsDdb.tableName,
        ORDERS_DDB: ordersDdb.tableName,
        ORDER_EVENTS_TOPIC_ARN: ordersTopic.topicArn
      }
    })

    ordersDdb.grantReadWriteData(this.ordersHandler)
    props.productsDdb.grantReadData(this.ordersHandler)
    ordersTopic.grantPublish(this.ordersHandler)

    // Function Handler
    const orderEventsHandler = new lambdaNodeJS.NodejsFunction(this, "OrderEventsFunction",{
      functionName: "OrderEventsFunction",
      entry: "lambda/orders/orderEventsFunction.ts",
      handler: "handler",
      memorySize: 256,
      timeout: cdk.Duration.seconds(2),
      runtime: lambda.Runtime.NODEJS_20_X,
      layers: [ordersEventsLayer, orderEventsRepositoryLayer],
      bundling: {
        minify: true,
        sourceMap: false,
      },
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,      
      environment: {
        EVENTS_DDB: props.eventsDdb.tableName,
        ORDER_EVENTS_TOPIC_ARN: ordersTopic.topicArn
      }
    })

    ordersTopic.addSubscription( new subs.LambdaSubscription(orderEventsHandler))

    const eventsDdbPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["dynamodb:PutItem"],
      resources: [props.eventsDdb.tableArn],
      conditions: {
        ['ForAllValues:StringLike']: {
          'dynamodb:LeadingKeys': ['#order_*']
        }
      }
    })
    orderEventsHandler.addToRolePolicy(eventsDdbPolicy)
  }
}