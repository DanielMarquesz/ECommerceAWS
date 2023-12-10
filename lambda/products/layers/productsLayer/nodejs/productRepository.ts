import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { v4 as uuid } from 'uuid'

export type ProductType = {
  id: string
  name: string
  code: string
  price: number
  model: string
}

export class ProductRepository {
  private ddbClient: DocumentClient
  private tableName: string

  constructor(ddbClient: DocumentClient, tableName: string) {
    this.ddbClient = ddbClient
    this.tableName = tableName
  }

  async getProducts(): Promise<ProductType[]> {
    const result = await this.ddbClient.scan({
      TableName: this.tableName
    }).promise()

    return result.Items as ProductType[]
  }

  async getProductById(id: string): Promise<ProductType> {
    const result = await this.ddbClient.get({
      TableName: this.tableName,
      Key: { id }
    }).promise()

    if(!result.Item) {
      throw new Error('Product not found')
    }

    return result.Item as ProductType
  }

  async createProduct(product: ProductType): Promise<ProductType> {
    const id = uuid()
    const newProduct = { ...product, id }

    await this.ddbClient.put({
      TableName: this.tableName,
      Item: newProduct
    }).promise()

    return newProduct
  }

  async deleteProduct(id: string): Promise<void> {
    const result = await this.ddbClient.delete({
      TableName: this.tableName,
      Key: { id },
      ReturnValues: 'ALL_OLD'
    }).promise()

    if(!result.Attributes) {
      throw new Error('Cannot delete product')
    }
  }

  async updateProduct(id: string, product: ProductType): Promise<ProductType> {
    const result = await this.ddbClient.update({
      TableName: this.tableName,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)',
      UpdateExpression: 'set #name = :name, #code = :code, #price = :price, #model = :model',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#code': 'code',
        '#price': 'price',
        '#model': 'model'
      },
      ExpressionAttributeValues: {
        ':name': product.name,
        ':code': product.code,
        ':price': product.price,
        ':model': product.model
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise()

    if(!result.Attributes) {
      throw new Error('Cannot update product')
    }

    return product
  }
}