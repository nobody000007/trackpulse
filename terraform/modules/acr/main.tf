resource "azurerm_container_registry" "main" {
  name                = "trackpulse${var.environment}registry"
  resource_group_name = var.resource_group
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = true
}
