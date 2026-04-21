# ─── PostgreSQL ───────────────────────────────────────────────────────────────

resource "azurerm_private_dns_zone" "postgres" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.resource_group
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "trackpulse-${var.environment}-postgres-dns-link"
  resource_group_name   = var.resource_group
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
}

resource "azurerm_private_endpoint" "postgres" {
  name                = "trackpulse-${var.environment}-db-pe"
  resource_group_name = var.resource_group
  location            = var.location
  subnet_id           = var.db_subnet_id

  private_service_connection {
    name                           = "trackpulse-${var.environment}-db-connection"
    private_connection_resource_id = var.postgres_id
    subresource_names              = ["postgresqlServer"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "db-dns-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.postgres.id]
  }
}

# ─── Storage ──────────────────────────────────────────────────────────────────

resource "azurerm_private_dns_zone" "storage" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = var.resource_group
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage" {
  name                  = "trackpulse-${var.environment}-storage-dns-link"
  resource_group_name   = var.resource_group
  private_dns_zone_name = azurerm_private_dns_zone.storage.name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false
}

resource "azurerm_private_endpoint" "storage" {
  name                = "trackpulse-${var.environment}-storage-pe"
  resource_group_name = var.resource_group
  location            = var.location
  subnet_id           = var.storage_subnet_id

  private_service_connection {
    name                           = "trackpulse-${var.environment}-storage-connection"
    private_connection_resource_id = var.storage_id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "storage-dns-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage.id]
  }
}
