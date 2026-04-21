terraform {
  backend "azurerm" {
    resource_group_name  = "rg-internship-handson-sc-001"
    storage_account_name = "trackpulsestorage001"
    container_name       = "tfstate"
    key                  = "staging.tfstate"
  }
}
