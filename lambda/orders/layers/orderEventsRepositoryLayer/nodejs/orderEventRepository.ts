import { DocumentClient } from "aws-sdk/clients/dynamodb"

export interface OrderEventDdb {
  pk: string
  sk: string
  ttl: string
  email: string
  createdAt: string
  requestId: string
  eventType: string
  info: {
    orderId: string
    productCodes: string[]
    messageId: string
  }
}

export class OrderEventRepository {
  private ddbClient: DocumentClient
  private eventsDdb: string

  constructor(ddbClient: DocumentClient, eventsDdb: string) {
    this.ddbClient = ddbClient
    this.eventsDdb = eventsDdb
  }

  createOrderEvent(orderEvent: OrderEventDdb) {
    return this.ddbClient.put({
      TableName: this.eventsDdb,
      Item: orderEvent
    }).promise()
  }
}