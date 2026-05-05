resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "trackpulse-${var.environment}-db"
  resource_group_name           = var.resource_group
  location                      = var.location
  version                       = "16"
  administrator_login           = "trackpulseadmin"
  administrator_password        = var.admin_password
  sku_name                      = var.sku_name
  storage_mb                    = var.storage_mb
  public_network_access_enabled = var.public_network_access_enabled

  lifecycle {
    ignore_changes = [zone, high_availability]
  }
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  count            = var.public_network_access_enabled ? 1 : 0
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_private_dns_zone" "postgres" {
  count               = var.pe_subnet_id != null ? 1 : 0
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.resource_group
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  count                 = var.pe_subnet_id != null ? 1 : 0
  name                  = "vnet-link-${var.environment}"
  resource_group_name   = var.resource_group
  private_dns_zone_name = azurerm_private_dns_zone.postgres[0].name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_private_endpoint" "postgres" {
  count               = var.pe_subnet_id != null ? 1 : 0
  name                = "pe-postgres-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group
  subnet_id           = var.pe_subnet_id

  private_service_connection {
    name                           = "psc-postgres"
    is_manual_connection           = false
    private_connection_resource_id = azurerm_postgresql_flexible_server.main.id
    subresource_names              = ["postgresqlServer"]
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.postgres[0].id]
  }
}
