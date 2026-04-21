resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "trackpulse-${var.environment}-db"
  resource_group_name           = var.resource_group
  location                      = var.location
  version                       = "16"
  administrator_login           = "trackpulseadmin"
  administrator_password        = var.admin_password
  sku_name                      = var.sku_name
  storage_mb                    = var.storage_mb
  public_network_access_enabled = false

  lifecycle {
    ignore_changes = [zone, high_availability]
  }
}
