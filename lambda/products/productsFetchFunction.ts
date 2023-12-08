import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"


export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
  ): Promise<APIGatewayProxyResult> => {

    const lambdaRequestId = context.awsRequestId
    const apiRequestId = event.requestContext.requestId

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    const method = event.httpMethod === "GET"
    if(event.resource === "/products" && method) {
      console.log("GET")

      return {
        statusCode: 200,
        body: JSON.stringify({message: "Succes"})
      }
    } else if(event.resource === "/products/{id}") {

      const productId = event.pathParameters?.id as string

      console.log(`GET products/${productId}`)

      return {
        statusCode: 200,
        body: JSON.stringify({message: `products/${productId}`})
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({message: "Bad Request"})
    }
}
