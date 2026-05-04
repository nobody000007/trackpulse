output "cluster_name" { value = azurerm_kubernetes_cluster.main.name }
output "host" { value = azurerm_kubernetes_cluster.main.kube_config[0].host }
output "client_certificate" { value = azurerm_kubernetes_cluster.main.kube_config[0].client_certificate }
output "client_key" { value = azurerm_kubernetes_cluster.main.kube_config[0].client_key }
output "cluster_ca_certificate" { value = azurerm_kubernetes_cluster.main.kube_config[0].cluster_ca_certificate }
