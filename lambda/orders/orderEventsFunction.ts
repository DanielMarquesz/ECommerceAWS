import { DynamoDB } from "aws-sdk"
import * as AWSXRay from "aws-xray-sdk"
import { OrderEventDdb, OrderEventRepository } from "/opt/nodejs/orderEventsRepositoryLayer"
import { Context, SNSEvent, SNSMessage } from "aws-lambda"
import { Envelope, OrderEvent } from "/opt/nodejs/orderEventsLayer"


AWSXRay.captureAWS(require("aws-sdk"))

const eventsDdb = process.env.EVENTS_DDB!

const ddbClient = new DynamoDB.DocumentClient()
const orderEventsRepository = new OrderEventRepository(ddbClient, eventsDdb)

export async function handler(event: SNSEvent, _context: Context): Promise<void> {

  for(const record of event.Records) {

    console.log(`Processing record: ${record.Sns.MessageId}`)
    await createEvent(record.Sns)
  }

  return 
}

function createEvent(body: SNSMessage) {

  const envelope = JSON.parse(body.Message) as Envelope
  const event = JSON.parse(envelope.data) as OrderEvent

  console.log(`
    Order event - MessageId: ${body.MessageId}
  `)

  const timestamp = Date.now()
  const ttl = ~~(timestamp / 1000 + 5 * 60)

  const orderEventDdb: OrderEventDdb = {
    pk: `#order_${event.orderId}`,
    sk: `${envelope.eventType}#${timestamp}`,
    ttl,
    email: event.email,
    createdAt: timestamp,
    eventType: envelope.eventType,
    requestId: event.requestId,
    info: {
      messageId: body.MessageId,
      orderId: event.orderId,
      productCodes: event.productCodes
    }    
  }

  return orderEventsRepository.createOrderEvent(orderEventDdb)
}