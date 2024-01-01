import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as dynamo from "aws-cdk-lib/aws-dynamodb"
import * as ssm from "aws-cdk-lib/aws-ssm"

import { Construct } from "constructs"

interface ProductsAppStackProps extends cdk.StackProps {
  eventsDdb: dynamo.Table
}
export class ProductsAppStack extends cdk.Stack {
  readonly productsFetchHandler: lambdaNodeJs.NodejsFunction
  readonly productsAdminHandler: lambdaNodeJs.NodejsFunction
  readonly productsDb: dynamo.Table

  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props)

    this.productsDb = new dynamo.Table(this, "ProductsDb", {
      tableName: 'products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: "id",
        type: dynamo.AttributeType.STRING
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    },)

    // Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn')
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsLayerVersionArn", productsLayerArn)

    // Products Events Layer
    const productsEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsEventsLayerVersionArn')
    const productsEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, "ProductsEventsLayerVersionArn", productsEventsLayerArn)

    const productsEventsHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsEventsFunction",
      {
        functionName: "ProductsEventsFunction",
        entry: "lambda/products/productsEventsFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(2),
        runtime: lambda.Runtime.NODEJS_20_X,
        layers: [productsEventsLayer],
        bundling: {
          minify: true,
          sourceMap: false, // desabilita geração de mapas para realizar debugs.
        },
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
        environment: {
          EVENTS_DDB: props.eventsDdb.tableName,
        }
      }
    )

    props.eventsDdb.grantWriteData(productsEventsHandler)

    this.productsFetchHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsFetchFunction",
      {
        functionName: "ProductsFetchFunction",
        entry: "lambda/products/productsFetchFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_20_X,
        layers: [productsLayer],
        bundling: {
          minify: true,
          sourceMap: false, // desabilita geração de mapas para realizar debugs.
        },
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
        environment: {
          PRODUCTS_DDB: this.productsDb.tableName
        }
      }
    )

    this.productsDb.grantReadData(this.productsFetchHandler)

    this.productsAdminHandler = new lambdaNodeJs.NodejsFunction(
      this,
      "ProductsAdminFunction",
      {
        functionName: "ProductsAdminFunction",
        entry: "lambda/products/productsAdminFunction.ts",
        handler: "handler",
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        runtime: lambda.Runtime.NODEJS_20_X,
        layers: [productsLayer, productsEventsLayer],
        bundling: {
          minify: true,
          sourceMap: false, // desabilita geração de mapas para realizar debugs.
        },
        tracing: lambda.Tracing.ACTIVE,
        insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0,
        environment: {
          PRODUCTS_DDB: this.productsDb.tableName,
          PRODUCTS_EVENTS_FUNCTION_NAME: productsEventsHandler.functionName
        }
      }
    )

    this.productsDb.grantWriteData(this.productsAdminHandler)
    productsEventsHandler.grantInvoke(this.productsAdminHandler)
  }
}