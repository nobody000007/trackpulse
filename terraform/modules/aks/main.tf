resource "azurerm_kubernetes_cluster" "main" {
  name                = "trackpulse-${var.environment}-aks"
  resource_group_name = var.resource_group
  location            = var.location
  dns_prefix          = "trackpulse-${var.environment}"

  default_node_pool {
    name           = "nodepool1"
    node_count     = var.node_count
    vm_size        = var.node_vm_size
    vnet_subnet_id = var.aks_subnet_id
  }

  identity {
    type = "SystemAssigned"
  }

  oidc_issuer_enabled = true

  network_profile {
    network_plugin = "azure"
    outbound_type  = "userDefinedRouting"
  }

  depends_on = [var.firewall_id, var.route_table_id]
}
