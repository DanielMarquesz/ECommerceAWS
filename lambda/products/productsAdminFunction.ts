import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { DynamoDB, Lambda } from "aws-sdk"
import { ProductRepository, Product } from "/opt/nodejs/productsLayer"
import * as AWSXRay from "aws-xray-sdk"
import { ProductEvent, ProductEventEnum } from "/opt/nodejs/productsEventsLayer";

const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const productsDdb = process.env.PRODUCTS_DDB as string
const productsEventsFunctionName = process.env.PRODUCTS_EVENTS_FUNCTION_NAME as string
const ddbClient = new DynamoDB.DocumentClient()
const lambdaClient = new Lambda()

const productRepository = new ProductRepository(ddbClient, productsDdb)

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
  ): Promise<APIGatewayProxyResult> => {

    const lambdaRequestId = context.awsRequestId
    const apiRequestId = event.requestContext.requestId

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    try {
      if(event.resource === "/products" && event.httpMethod === "POST") {
        console.log("POST /products")
  
        const product = JSON.parse(event.body!) as unknown as Product
        const result = await productRepository.createProduct(product)

        const invocationResponse = await sendProductEvent(
          result,
          ProductEventEnum.CREATED,
          'daniel.mango@email.com',
          lambdaRequestId,
          apiRequestId
          )

          console.log('Invoke Response Update', invocationResponse)
  
        return {
          statusCode: 201,
          body: JSON.stringify({ result })
        }
      } else if(event.resource === "/products/{id}") {
        const productId = event.pathParameters?.id as string
  
        if(event.httpMethod === "PUT") {
          console.log("PUT /products")
  
          const product = JSON.parse(event.body!) as unknown as Product
          const result = await productRepository.updateProduct(productId, product)

          const invocationResponse = await sendProductEvent(
            result,
            ProductEventEnum.UPDATED,
            'daniel.mango@email.com',
            lambdaRequestId,
            apiRequestId
            )
  
            console.log('Invoke Response Update', invocationResponse)
  
          return {
            statusCode: 204,
            body: JSON.stringify({ 
              message: `${productId} atualizado!`,
              product: result,
            })
          }
  
        } else if(event.httpMethod === "DELETE") {
          console.log("DELETE /products")          
          
          const result = await productRepository.getProductById(productId)
          
          await productRepository.deleteProduct(productId)

            const invocationResponse = await sendProductEvent(
            result,
            ProductEventEnum.DELETED,
            'daniel.manga@email.com',
            lambdaRequestId,
            apiRequestId
            )
  
            console.log('Invoke Response Update', invocationResponse)
            console.log('Produto deletadi', result.id)
  
          return {
            statusCode: 204,
            body: JSON.stringify({message: `${productId} deletado!`})
          }
        }  
      }
    } catch (error: any) {
      return {
        statusCode: 400,
        body: JSON.stringify({message: "Bad Request", errorMessage: error.message})
      }      
    }
    return {
      statusCode: 500,
      body: JSON.stringify({message: "Internal Server Error"})
    }
}

function sendProductEvent(product: Product, eventType: ProductEventEnum, email: string, lambdaRequestId: string, apiRequestId: string) {
  const event: ProductEvent = {
    requestId: lambdaRequestId,
    eventType,
    productId: product.id,
    productCode: product.code,
    productPrice: product.price,
    email,
  }

  console.log("Invoking ProductsEventsFunction")

  const params = {
    FunctionName: productsEventsFunctionName,
    InvocationType: "RequestResponse", // Para o modelo de invocação síncrona
    Payload: JSON.stringify(event),
    ClientContext: Buffer.from(JSON.stringify({requestId: apiRequestId})).toString("base64"),
  }

  return lambdaClient.invoke(params).promise()
}