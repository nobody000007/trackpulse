output "vnet_id" { value = azurerm_virtual_network.main.id }
output "vnet_name" { value = azurerm_virtual_network.main.name }
output "firewall_subnet_id" { value = azurerm_subnet.firewall.id }
output "firewall_mgmt_subnet_id" { value = azurerm_subnet.firewall_mgmt.id }
output "aks_subnet_id" { value = azurerm_subnet.aks.id }
output "db_subnet_id" { value = azurerm_subnet.db.id }
output "storage_subnet_id" { value = azurerm_subnet.storage.id }
output "route_table_id" { value = azurerm_route_table.main.id }
