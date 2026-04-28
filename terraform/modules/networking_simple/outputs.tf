output "vnet_id"       { value = azurerm_virtual_network.main.id }
output "aks_subnet_id" { value = azurerm_subnet.aks.id }
output "ase_subnet_id" { value = azurerm_subnet.ase.id }
