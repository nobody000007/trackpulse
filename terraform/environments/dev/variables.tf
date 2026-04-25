variable "db_admin_password"  { sensitive = true }
variable "nextauth_secret"    { sensitive = true }
variable "groq_api_key"       { sensitive = true }
variable "gmail_user"         { sensitive = true }
variable "gmail_app_password" { sensitive = true }
variable "my_ip"              { default = "70.52.17.126" }
variable "aks_node_ip"        { default = "10.240.0.4" }
