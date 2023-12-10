import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as ssm from "aws-cdk-lib/aws-ssm"

export class ProductsAppLayersStack extends cdk.Stack {
  readonly productsLayer: lambda.LayerVersion

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.productsLayer = new lambda.LayerVersion(this, "ProductsLayer", {
      code: lambda.Code.fromAsset("lambda/products/layers/productsLayer"),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      layerVersionName: "ProductsLayer",
      removalPolicy: cdk.RemovalPolicy.RETAIN, // mantem o Layer casoa  stack seja destruida
    })

    new ssm.StringParameter(this, "ProductsLayerVersionArn", {
      parameterName: "ProductsLayerVersionArn",
      stringValue: this.productsLayer.layerVersionArn,
    })
  }
}