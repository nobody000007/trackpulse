variable "environment" {}
variable "resource_group" {}
variable "location" {}
variable "replication_type" { default = "LRS" }
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
