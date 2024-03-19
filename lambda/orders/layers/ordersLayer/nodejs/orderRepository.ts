import { DocumentClient } from "aws-sdk/clients/dynamodb"
import { v4 as uuid } from "uuid"

export interface OrderProduct {
  code: string
  price: number
}

export interface Order {
  pk: string
  sk?: string
  createdAt?: number
  shipping: {
    type: "URGENT" | "ECONOMIC"
    carrier: "CORREIOS" | "FEDEX"
  },
  billing: {
    payment: "CASH" | "DEBIT_CARD" | "CREDIT_CARD",
    totalPrice: number
  },
  products: OrderProduct[]
}

export class OrderRepository {
  private ddbClient: DocumentClient
  private ordersDdb: string

  constructor(ddbClient: DocumentClient, orderDdb: string) {
    this.ddbClient = ddbClient
    this.ordersDdb = orderDdb
  }

  async createOrder(order: Order): Promise<Order> {

    console.log("Creating order!", order)

    order.sk = uuid()
    order.createdAt = Date.now()

    await this.ddbClient.put({
      TableName: this.ordersDdb,
      Item: order
    }).promise()

    return order
  }

  async getOrders(): Promise<Order[]> {

    console.log("Getting orders")

    const orders = await this.ddbClient.scan({
      TableName: this.ordersDdb,
    }).promise()

    return orders.Items as Order[]
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {

    console.log("Getting orders by email")

    const orders = await this.ddbClient.query({
      TableName: this.ordersDdb,
      KeyConditionExpression: "pk = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    }).promise()

    return orders.Items as Order[]
  }

  async getOrder(email: string, orderId: string): Promise<Order> {

    console.log(`Getting order by email: ${email} and orderId: ${orderId}`)

    const order = await this.ddbClient.get({
      TableName: this.ordersDdb,
      Key: {
        pk: email,
        sk: orderId
      }
    }).promise()

    return order.Item as Order
  }

  async deleteOrder(email: string, orderId: string): Promise<Order> {

    console.log(`Deleting order by email: ${email} and orderId: ${orderId}`)

    const data = await this.ddbClient.delete({
      TableName: this.ordersDdb,
      Key: {
        pk: email,
        sk: orderId
      },
      ReturnValues: "ALL_OLD"
    }).promise()

    if(data.Attributes) {
      return data.Attributes as Order
    } else {
      throw new Error('Order not found')
    }
  }
}