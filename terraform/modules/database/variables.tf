variable "environment"      { }
variable "resource_group"   { }
variable "location"         { }
variable "admin_password"   { sensitive = true }
variable "sku_name"         { default = "B_Standard_B1ms" }
variable "storage_mb"       { default = 32768 }
