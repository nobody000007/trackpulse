output "vnet_id" { value = azurerm_virtual_network.main.id }
output "apim_subnet_id" { value = azurerm_subnet.apim.id }
output "pe_subnet_id" { value = azurerm_subnet.pe.id }
output "app_subnet_id" { value = azurerm_subnet.app.id }
