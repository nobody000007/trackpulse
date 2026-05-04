variable "environment" {}
variable "resource_group" {}
variable "location" {}
variable "firewall_subnet_id" {}
variable "firewall_mgmt_subnet_id" {}
variable "my_ip" {}
variable "aks_node_ip" { description = "AKS node internal IP for DNAT rule" }
variable "aks_subnet_cidr" {}
