import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"


export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
  ): Promise<APIGatewayProxyResult> {

    const lambdaRequestId = context.awsRequestId
    const apiRequestId = event.httpMethod

    console.log(`API Gateway RequestId: ${apiRequestId} - Lambda RequestId: ${lambdaRequestId}`)

    const method = event.httpMethod === "GET"
    if(event.resource === "/products" && method) {
      console.log("GET")

      return {
        statusCode: 200,
        body: JSON.stringify({message: "Succes"})
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({message: "Bad Request"})
    }
}
