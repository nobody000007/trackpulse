variable "environment"    { }
variable "resource_group" { }
variable "location"       { }
variable "aks_subnet_id"  { }
variable "node_count"     { default = 1 }
variable "node_vm_size"   { default = "Standard_B2als_v2" }
variable "firewall_id"    { }
variable "route_table_id" { }
