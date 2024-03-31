import * as lambdaNodeJs from "aws-cdk-lib/aws-lambda-nodejs"
import * as cdk from "aws-cdk-lib"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as cwlogs from "aws-cdk-lib/aws-logs"

import { Construct } from "constructs"

type ECommerceApiStackProps = cdk.StackProps & {
  productsFetchHandler: lambdaNodeJs.NodejsFunction
  productsAdminHandler: lambdaNodeJs.NodejsFunction
  ordersHandler: lambdaNodeJs.NodejsFunction
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
      cloudWatchRole: true,
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

    // Create resources in API
    this.crateProductsService(props, api)
    this.createOrdersService(props, api)
  }

  private crateProductsService(props: ECommerceApiStackProps, api: cdk.aws_apigateway.RestApi) {

    const productRequestValidator = new apigateway.RequestValidator(this, "ProductRequestValidator", {
      restApi: api,
      requestValidatorName: "Product request validator",
      validateRequestBody: true
    })

    const productModel = new apigateway.Model(this, "ProductModel", {
      modelName: "productModel",
      restApi: api,
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          name: {
            type: apigateway.JsonSchemaType.STRING,
          },
          code: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1
          },
          price: {
            type: apigateway.JsonSchemaType.NUMBER,
            minLength: 1
          },
          model: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1
          },
          productUrl: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1
          },
        },
        required: [
          "name",
          "code",
          "price",
          "model",
          "productUrl"
        ]
      }
    })

    const productsFetchIntegration = new apigateway.LambdaIntegration(props.productsFetchHandler)
    const productsAdminIntegration = new apigateway.LambdaIntegration(props.productsAdminHandler)

    //  /products
    const productsResource = api.root.addResource("products")
    productsResource.addMethod("GET", productsFetchIntegration)

    // GET /products/{id}
    const productIdResource = productsResource.addResource("{id}")
    productIdResource.addMethod("GET", productsFetchIntegration)

    // POST /products
    productsResource.addMethod("POST", productsAdminIntegration, {
      requestValidator: productRequestValidator,
      requestModels: {
        "application/json" : productModel
      }
    })

    // PUT /products/{id}
    productIdResource.addMethod("PUT", productsAdminIntegration)

    // DELETE /products/{id}
    productIdResource.addMethod("DELETE", productsAdminIntegration)
  }

  private createOrdersService(props: ECommerceApiStackProps, api: cdk.aws_apigateway.RestApi) {
    const orderIntegration = new apigateway.LambdaIntegration(props.ordersHandler)

    // resource - /orders
    const ordersResource = api.root.addResource('orders')
    
    // GET /orders
    // GET /orders?email=matilde@siecola.com.br
    // GET /orders?email=matilde@siecola.com.br&orderId=123
    ordersResource.addMethod("GET", orderIntegration)

    const orderDeletionValidator = new apigateway.RequestValidator(this, "OrderDeletionValidator", {
      restApi: api,
      requestValidatorName: "OrderDeletionValidator",
      validateRequestParameters: true,
    })

    // DELETE /orders?email=matilde@siecola.com.br&orderId=123
    ordersResource.addMethod("DELETE", orderIntegration, {
      requestParameters: {
        'method.request.querystring.email': true,
        'method.request.querystring.orderId': true
      },
      requestValidator: orderDeletionValidator
    })

    // POST /orders
    const orderRequestValidator = new apigateway.RequestValidator(this, "OrderRequestValidator", {
      restApi: api,
      requestValidatorName: "Order request validator",
      validateRequestBody: true
    })

    const orderModel = new apigateway.Model(this, "OrderModel", {
      modelName: "orderModel",
      restApi: api,
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          email: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1
          },
          productIds: {
            type: apigateway.JsonSchemaType.ARRAY,
            minLength: 1,
            items: {
              type: apigateway.JsonSchemaType.STRING
            }
          },
          payment: {
            type: apigateway.JsonSchemaType.STRING,
            enum: ["CASH", "DEBIT_CARD", "CREDIT_CARD"]
          }
        },
        required: [
          "email",
          "productIds",
          "payment"
        ]
      }
    })

    ordersResource.addMethod("POST", orderIntegration, {
      requestValidator: orderRequestValidator,
      requestModels: { "application/json": orderModel }
    })
  }
}