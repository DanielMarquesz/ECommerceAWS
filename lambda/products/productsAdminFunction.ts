import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"


export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
  ): Promise<APIGatewayProxyResult> => {

    const lambdaRequestId = context.awsRequestId
    const apiRequestId = event.requestContext.requestId

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    // const method = event.httpMethod === "GET"
    if(event.resource === "/products" && event.httpMethod === "POST") {
      console.log("POST /products")

      return {
        statusCode: 201,
        body: JSON.stringify({message: "POST /products"})
      }
    } else if(event.resource === "/products/{id}") {
      const productId = event.pathParameters?.id as string

      if(event.httpMethod === "PUT") {
        console.log("PUT /products")
        return {
          statusCode: 204,
          body: JSON.stringify({message: `${productId} atualizado!`})
        }

      } else if(event.httpMethod === "DELETE") {
        console.log("DELETE /products")
        return {
          statusCode: 204,
          body: JSON.stringify({message: `${productId} deletado!`})
        }
      }


    }

    return {
      statusCode: 400,
      body: JSON.stringify({message: "Bad Request"})
    }
}
