output "postgres_private_ip" {
  value = azurerm_private_endpoint.postgres.private_service_connection[0].private_ip_address
}

output "storage_private_ip" {
  value = azurerm_private_endpoint.storage.private_service_connection[0].private_ip_address
}
