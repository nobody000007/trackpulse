resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "trackpulse-${var.environment}-db"
  resource_group_name           = var.resource_group
  location                      = var.location
  version                       = "16"
  administrator_login           = "trackpulseadmin"
  administrator_password        = var.admin_password
  sku_name                      = var.sku_name
  storage_mb                    = var.storage_mb
  public_network_access_enabled = true

  lifecycle {
    ignore_changes = [zone, high_availability]
  }
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
