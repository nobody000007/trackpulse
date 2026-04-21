variable "environment"           { }
variable "firewall_ip"           { }
variable "db_url"                { sensitive = true }
variable "nextauth_secret"       { sensitive = true }
variable "groq_api_key"          { sensitive = true }
variable "gmail_user"            { sensitive = true }
variable "gmail_app_password"    { sensitive = true }
variable "storage_conn_string"   { sensitive = true }
variable "acr_login_server"      { }
variable "acr_username"          { }
variable "acr_password"          { sensitive = true }
