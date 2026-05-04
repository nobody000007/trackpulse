variable "environment" {}
variable "resource_group" {}
variable "location" {}
variable "publisher_email" { default = "admin@trackpulse.local" }
variable "publisher_name" { default = "TrackPulse" }
variable "backend_url" {}
variable "app_insights_id" {}
variable "app_insights_instrumentation_key" { sensitive = true }
