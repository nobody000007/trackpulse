variable "db_admin_password" { sensitive = true }
variable "nextauth_secret" { sensitive = true }
variable "groq_api_key" { sensitive = true }
variable "gmail_user" { sensitive = true }
variable "gmail_app_password" { sensitive = true }
variable "app_insights_connection_string" {
  sensitive = true
  default   = ""
}
variable "app_url" { default = "http://localhost" }
