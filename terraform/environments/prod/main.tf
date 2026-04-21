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
  source                    = "../../modules/networking"
  environment               = local.environment
  resource_group            = local.resource_group
  location                  = local.location
  vnet_cidr                 = "10.0.0.0/8"
  firewall_subnet_cidr      = "10.1.0.0/16"
  firewall_mgmt_subnet_cidr = "10.3.0.0/16"
  aks_subnet_cidr           = "10.240.0.0/16"
  db_subnet_cidr            = "10.2.0.0/16"
  storage_subnet_cidr       = "10.4.0.0/16"
}

module "firewall" {
  source                  = "../../modules/firewall"
  environment             = local.environment
  resource_group          = local.resource_group
  location                = local.location
  firewall_subnet_id      = module.networking.firewall_subnet_id
  firewall_mgmt_subnet_id = module.networking.firewall_mgmt_subnet_id
  my_ip                   = var.my_ip
  aks_node_ip             = var.aks_node_ip
  aks_subnet_cidr         = "10.240.0.0/16"
}

module "aks" {
  source         = "../../modules/aks"
  environment    = local.environment
  resource_group = local.resource_group
  location       = local.location
  aks_subnet_id  = module.networking.aks_subnet_id
  node_count     = 2                          # More nodes for prod
  node_vm_size   = "Standard_B4als_v2"        # Bigger VM for prod
  firewall_id    = module.firewall.firewall_id
  route_table_id = module.networking.route_table_id
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
  sku_name       = "B_Standard_B2ms"          # Bigger DB for prod
  storage_mb     = 65536                       # 64GB for prod
}

module "storage" {
  source           = "../../modules/storage"
  environment      = local.environment
  resource_group   = local.resource_group
  location         = local.location
  replication_type = "GRS"                     # Geo-redundant for prod
}

module "private_endpoints" {
  source            = "../../modules/private_endpoints"
  environment       = local.environment
  resource_group    = local.resource_group
  location          = local.location
  vnet_id           = module.networking.vnet_id
  db_subnet_id      = module.networking.db_subnet_id
  storage_subnet_id = module.networking.storage_subnet_id
  postgres_id       = module.database.id
  storage_id        = module.storage.id
}

module "kubernetes" {
  source              = "../../modules/kubernetes"
  environment         = local.environment
  firewall_ip         = module.firewall.public_ip
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
