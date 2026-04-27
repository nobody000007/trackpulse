resource "azurerm_app_service_environment_v3" "main" {
  name                         = "ase-trackpulse-${var.environment}"
  resource_group_name          = var.resource_group
  subnet_id                    = var.ase_subnet_id
  internal_load_balancing_mode = "None"
}
