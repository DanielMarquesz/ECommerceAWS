import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { DynamoDB } from "aws-sdk"
import { ProductRepository, ProductType } from "/opt/nodejs/productsLayer"
import * as AWSXRay from "aws-xray-sdk"

const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const productsDdb = process.env.PRODUCTS_DDB as string
const ddbClient = new DynamoDB.DocumentClient()

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
  
        const product = JSON.parse(event.body!) as unknown as ProductType
        const result = await productRepository.createProduct(product)
  
        return {
          statusCode: 201,
          body: JSON.stringify({ result })
        }
      } else if(event.resource === "/products/{id}") {
        const productId = event.pathParameters?.id as string
  
        if(event.httpMethod === "PUT") {
          console.log("PUT /products")
  
          const product = JSON.parse(event.body!) as unknown as ProductType
          const result = await productRepository.updateProduct(productId, product)
  
          return {
            statusCode: 204,
            body: JSON.stringify({ 
              message: `${productId} atualizado!`,
              product: result,
            })
          }
  
        } else if(event.httpMethod === "DELETE") {
          console.log("DELETE /products")
  
          
          await productRepository.deleteProduct(productId)
  
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
