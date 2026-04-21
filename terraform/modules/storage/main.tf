resource "azurerm_storage_account" "main" {
  name                          = "trackpulse${var.environment}storage"
  resource_group_name           = var.resource_group
  location                      = var.location
  account_tier                  = "Standard"
  account_replication_type      = var.replication_type
  public_network_access_enabled = false
}
