variable "environment" {}
variable "resource_group" {}
variable "location" {}
variable "admin_password" { sensitive = true }
variable "sku_name" { default = "B_Standard_B1ms" }
variable "storage_mb" { default = 32768 }
variable "public_network_access_enabled" {
  type    = bool
  default = true
}
variable "vnet_id" {
  type    = string
  default = null
}
variable "pe_subnet_id" {
  type    = string
  default = null
}
