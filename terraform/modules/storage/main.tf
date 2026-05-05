resource "azurerm_storage_account" "main" {
  name                          = "trackpulse${var.environment}storage"
  resource_group_name           = var.resource_group
  location                      = var.location
  account_tier                  = "Standard"
  account_replication_type      = var.replication_type
  public_network_access_enabled = var.public_network_access_enabled
}

resource "azurerm_private_dns_zone" "blob" {
  count               = var.private_endpoint_enabled ? 1 : 0
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = var.resource_group
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  count                 = var.pe_subnet_id != null ? 1 : 0
  name                  = "vnet-link-${var.environment}"
  resource_group_name   = var.resource_group
  private_dns_zone_name = azurerm_private_dns_zone.blob[0].name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_private_endpoint" "blob" {
  count               = var.private_endpoint_enabled ? 1 : 0
  name                = "pe-storage-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group
  subnet_id           = var.pe_subnet_id

  private_service_connection {
    name                           = "psc-blob"
    is_manual_connection           = false
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob[0].id]
  }
}
