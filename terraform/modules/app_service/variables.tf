variable "environment" {}
variable "resource_group" {}
variable "location" {}
variable "ase_id" {}
variable "sku_name" { default = "I1v2" }
variable "acr_login_server" {}
variable "acr_username" {}
variable "acr_password" { sensitive = true }
variable "db_url" { sensitive = true }
variable "nextauth_secret" { sensitive = true }
variable "groq_api_key" { sensitive = true }
variable "gmail_user" {}
variable "gmail_app_password" { sensitive = true }
variable "storage_conn_string" { sensitive = true }
variable "app_insights_connection_string" { sensitive = true }
