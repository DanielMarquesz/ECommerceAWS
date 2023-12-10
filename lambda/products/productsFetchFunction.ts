import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import { ProductRepository } from "/opt/nodejs/productsLayer"
import { DynamoDB } from "aws-sdk"

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
  const method = event.httpMethod === "GET"
  if(event.resource === "/products" && method) {
    console.log("GET")

    const products = await productRepository.getProducts()

    return {
      statusCode: 200,
      body: JSON.stringify({ products })
    }
  } else if(event.resource === "/products/{id}") {

    const productId = event.pathParameters?.id as string

    console.log(`GET products/${productId}`)

    const product = await productRepository.getProductById(productId)

    return {
      statusCode: 200,
      body: JSON.stringify({ product })
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
