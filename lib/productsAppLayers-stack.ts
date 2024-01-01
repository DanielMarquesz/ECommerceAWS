import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as ssm from "aws-cdk-lib/aws-ssm"

export class ProductsAppLayersStack extends cdk.Stack {
  readonly productsLayer: lambda.LayerVersion

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const productsLayer = new lambda.LayerVersion(this, "ProductsLayer", {
      code: lambda.Code.fromAsset("lambda/products/layers/productsLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      layerVersionName: "ProductsLayer",
      removalPolicy: cdk.RemovalPolicy.RETAIN, // mantem o Layer casoa  stack seja destruida
    })

    new ssm.StringParameter(this, "ProductsLayerVersionArn", {
      parameterName: "ProductsLayerVersionArn",
      stringValue: productsLayer.layerVersionArn,
    })


    const productsEventsLayer = new lambda.LayerVersion(this, "ProductsEventsLayer", {
      code: lambda.Code.fromAsset("lambda/products/layers/productsEventsLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      layerVersionName: "ProductsEventsLayer",
      removalPolicy: cdk.RemovalPolicy.RETAIN, // mantem o Layer casoa  stack seja destruida
    })

    new ssm.StringParameter(this, "ProductsEventsLayerVersionArn", {
      parameterName: "ProductsEventsLayerVersionArn",
      stringValue: productsEventsLayer.layerVersionArn,
    })
  }
}