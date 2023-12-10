#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductsAppStack } from '../lib/productsApp-stack';
import { EcommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProductsAppLayersStack } from '../lib/productsAppLayers-stack';


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

const productsAppStack = new ProductsAppStack(app, "ProductsApp", {
  tags,
  env,
})

productsAppStack.addDependency(productsAppLayerStack)

const ecommercAppStack = new EcommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  tags,
  env,
})

ecommercAppStack.addDependency(productsAppStack)