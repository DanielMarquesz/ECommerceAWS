import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as cwlogs from "aws-cdk-lib/aws-logs"

import { Construct } from "constructs"

// const methodsList = [
//   {
//     method: "GET",
//     resource: "products"
//   }
// ]

type ECommerceApiStackProps = cdk.StackProps & {
  productsFetchHandler: lambdaNodeJs.NodejsFunction,
}

export class EcommerceApiStack extends cdk.Stack {

  constructor(
    scope: Construct, 
    id: string,
    props: ECommerceApiStackProps
    ) {
    super(scope, id, props)

    const logGroup = new cwlogs.LogGroup(this, "ECommerceApiLogs")
    const api = new apigateway.RestApi(this, "EcommerceApi", {
      restApiName: "EcommerceApi",
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true
        })
      }
    })

    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)
    
    // for(let item of methodsList) {
    //   const productsResource = api.root.addResource(item.resource)
    //   productsResource.addMethod(item.method, productsFetchIntegration)
    // }

    const productsResource = api.root.addResource("products")
    productsResource.addMethod("GET", productsFetchIntegration)
  }
}