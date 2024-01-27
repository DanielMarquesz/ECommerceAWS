#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { EcommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProductsAppLayersStack } from '../lib/productsAppLayers-stack';
import { EventsDdbStack } from '../lib/eventsDdb-stack';
import { OrdersAppLayersStack } from 'lib/ordersAppLayers-stack';
import { OrdersAppStack } from 'lib/ordersApp-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.AWS_ACCOUNT_ID as string,
  region: "us-east-1",
}

const tags = {
  cost: "ECommerce",
  team: "Welbe"
}

const productsAppLayerStack = new ProductsAppLayersStack(app, "ProductsAppLayers", {
  tags,
  env
})

const eventsDdbStack = new EventsDdbStack(app, "EventsDdb", {
  tags,
  env,
})

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  tags,
  env,
  eventsDdb: eventsDdbStack.table,
})



const ordersAppLayersStack = new OrdersAppLayersStack(app, "OrdersAppLayers", {
  tags,
  env,
})

const ordersAppStack = new OrdersAppStack(app, "OrdersApp", {
  tags,
  env,
  productsDdb: productsAppStack.productsDb
})

productsAppStack.addDependency(productsAppLayerStack)
productsAppStack.addDependency(eventsDdbStack)
ordersAppStack.addDependency(productsAppStack)
ordersAppStack.addDependency(ordersAppLayersStack)

const ecommercAppStack = new EcommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: ordersAppStack.ordersHandler,
  tags,
  env,
})

ecommercAppStack.addDependency(productsAppStack)