terraform {
  required_providers {
    azurerm    = { source = "hashicorp/azurerm", version = "~> 3.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.0" }
  }
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}

provider "kubernetes" {
  host                   = module.aks.host
  client_certificate     = base64decode(module.aks.client_certificate)
  client_key             = base64decode(module.aks.client_key)
  cluster_ca_certificate = base64decode(module.aks.cluster_ca_certificate)
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

module "aks" {
  source         = "../../modules/aks"
  environment    = local.environment
  resource_group = local.resource_group
  location       = local.location
  aks_subnet_id  = module.networking.aks_subnet_id
  node_count     = 1
  node_vm_size   = "Standard_B2als_v2"
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

module "ase" {
  source         = "../../modules/ase"
  environment    = local.environment
  resource_group = local.resource_group
  ase_subnet_id  = module.networking.ase_subnet_id
}

module "app_service" {
  source                         = "../../modules/app_service"
  environment                    = local.environment
  resource_group                 = local.resource_group
  location                       = local.location
  ase_id                         = module.ase.id
  sku_name                       = "I1v2"
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
}

module "kubernetes" {
  source              = "../../modules/kubernetes"
  environment         = local.environment
  app_url             = var.app_url
  db_url              = local.db_url
  nextauth_secret     = var.nextauth_secret
  groq_api_key        = var.groq_api_key
  gmail_user          = var.gmail_user
  gmail_app_password  = var.gmail_app_password
  storage_conn_string = local.storage_conn
  acr_login_server    = module.acr.login_server
  acr_username        = module.acr.admin_username
  acr_password        = module.acr.admin_password
}

data "azurerm_application_insights" "main" {
  name                = "appi-trackpulse-${local.environment}"
  resource_group_name = local.resource_group
}

module "apim" {
  source                           = "../../modules/apim"
  environment                      = local.environment
  resource_group                   = local.resource_group
  location                         = local.location
  publisher_email                  = var.gmail_user
  backend_url                      = "app-trackpulse-${local.environment}.${module.ase.dns_suffix}"
  app_insights_id                  = data.azurerm_application_insights.main.id
  app_insights_instrumentation_key = data.azurerm_application_insights.main.instrumentation_key
}
