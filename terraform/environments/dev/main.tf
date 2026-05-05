terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
  }
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}

locals {
  environment    = "dev"
  resource_group = "rg-internship-handson-sc-001"
  location       = "swedencentral"

  db_url       = "postgresql://trackpulseadmin:${var.db_admin_password}@${module.database.fqdn}/trackpulse?sslmode=require"
  storage_conn = "DefaultEndpointsProtocol=https;AccountName=${module.storage.name};AccountKey=${module.storage.primary_access_key};EndpointSuffix=core.windows.net"
}

module "networking" {
  source         = "../../modules/networking_simple"
  environment    = local.environment
  resource_group = local.resource_group
  location       = local.location
}

module "acr" {
  source         = "../../modules/acr"
  environment    = local.environment
  resource_group = local.resource_group
  location       = local.location
}

module "database" {
  source         = "../../modules/database"
  environment    = local.environment
  resource_group = local.resource_group
  location       = local.location
  admin_password = var.db_admin_password
  sku_name       = "B_Standard_B1ms"
  storage_mb     = 32768
}

module "storage" {
  source           = "../../modules/storage"
  environment      = local.environment
  resource_group   = local.resource_group
  location         = local.location
  replication_type = "LRS"
}

module "app_service" {
  source                         = "../../modules/app_service"
  environment                    = local.environment
  resource_group                 = local.resource_group
  location                       = local.location
  sku_name                       = "B1"
  acr_login_server               = module.acr.login_server
  acr_username                   = module.acr.admin_username
  acr_password                   = module.acr.admin_password
  db_url                         = local.db_url
  nextauth_secret                = var.nextauth_secret
  groq_api_key                   = var.groq_api_key
  gmail_user                     = var.gmail_user
  gmail_app_password             = var.gmail_app_password
  storage_conn_string            = local.storage_conn
  app_insights_connection_string = var.app_insights_connection_string
  public_network_access_enabled  = false
  vnet_id                        = module.networking.vnet_id
  pe_subnet_id                   = module.networking.pe_subnet_id
}

module "apim" {
  source          = "../../modules/apim"
  environment     = local.environment
  resource_group  = local.resource_group
  location        = local.location
  publisher_email = var.gmail_user
  backend_url     = module.app_service.default_hostname
  subnet_id       = module.networking.apim_subnet_id
}
