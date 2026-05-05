resource "azurerm_api_management" "main" {
  name                = "apim-trackpulse-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name            = "Developer_1"

  virtual_network_type = var.subnet_id != null ? "External" : "None"

  dynamic "virtual_network_configuration" {
    for_each = var.subnet_id != null ? [1] : []
    content {
      subnet_id = var.subnet_id
    }
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_api_management_api" "trackpulse" {
  name                  = "trackpulse-api"
  resource_group_name   = var.resource_group
  api_management_name   = azurerm_api_management.main.name
  revision              = "1"
  display_name          = "TrackPulse API"
  path                  = "trackpulse"
  protocols             = ["https"]
  service_url           = "https://${var.backend_url}"
  subscription_required = false
}

resource "azurerm_api_management_api_operation" "health" {
  operation_id        = "health"
  api_name            = azurerm_api_management_api.trackpulse.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group
  display_name        = "Health Check"
  method              = "GET"
  url_template        = "/api/health"
}

resource "azurerm_api_management_api_operation" "test_error" {
  operation_id        = "test-error"
  api_name            = azurerm_api_management_api.trackpulse.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group
  display_name        = "Test Error"
  method              = "GET"
  url_template        = "/api/test-error"
}

resource "azurerm_api_management_api_policy" "trackpulse" {
  api_name            = azurerm_api_management_api.trackpulse.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = var.resource_group
  xml_content         = file("${path.module}/policies/api-policy.xml")
}
