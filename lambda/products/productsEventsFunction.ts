import { Callback, Context } from "aws-lambda";
import { ProductEvent } from "/opt/nodejs/productsEventsLayer";
import { DynamoDB } from "aws-sdk";
import * as AWSXRay from "aws-xray-sdk";

AWSXRay.captureAWS(require("aws-sdk"))

const eventsDdb = process.env.EVENTS_DDB as string
const ddbClient = new DynamoDB.DocumentClient()

export async function name(event: ProductEvent, context: Context, callback: Callback) {
  console.log(event)
  console.log(`Lambda requestId: ${context.awsRequestId}`)

  try {
    await createEvent(event)
    callback(null, JSON.stringify('OK'))
  } catch (error) {
    console.log(error)
    callback(null, error)
  }

  callback(null, JSON.stringify('Internal Server Error'))
}

function createEvent(event: ProductEvent) {
  const timestamp = Date.now()
  const ttl = ~~(timestamp / 100) + 5 * 60

  return ddbClient.put({
    TableName: eventsDdb,
    Item: {
      pk: `#product_${event.productCode}`,
      sk: `${event.eventType}#${timestamp}`,
      email: event.email,
      createEvent: timestamp,
      requestId: event.requestId,
      eventType: event.eventType,
      info: {
        productId: event.productId,
        price: event.productPrice,
      },
      ttl,
    }
  }).promise()
}