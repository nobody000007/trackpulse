variable "environment" {}
variable "resource_group" {}
variable "location" {}
variable "publisher_email" { default = "admin@trackpulse.local" }
variable "publisher_name" { default = "TrackPulse" }
variable "backend_url" {}
variable "subnet_id" {
  type    = string
  default = null
}
