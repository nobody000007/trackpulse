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
  environment    = "prod"
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
  node_count     = 2
  node_vm_size   = "Standard_B4als_v2"
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
  sku_name       = "B_Standard_B2ms"
  storage_mb     = 65536
}

module "storage" {
  source           = "../../modules/storage"
  environment      = local.environment
  resource_group   = local.resource_group
  location         = local.location
  replication_type = "GRS"
}

module "kubernetes" {
  source                         = "../../modules/kubernetes"
  environment                    = local.environment
  app_url                        = var.app_url
  db_url                         = local.db_url
  nextauth_secret                = var.nextauth_secret
  groq_api_key                   = var.groq_api_key
  gmail_user                     = var.gmail_user
  gmail_app_password             = var.gmail_app_password
  storage_conn_string            = local.storage_conn
  app_insights_connection_string = var.app_insights_connection_string
  acr_login_server               = module.acr.login_server
  acr_username                   = module.acr.admin_username
  acr_password                   = module.acr.admin_password
}
