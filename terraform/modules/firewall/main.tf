resource "azurerm_public_ip" "firewall" {
  name                = "trackpulse-${var.environment}-firewall-pip"
  resource_group_name = var.resource_group
  location            = var.location
  sku                 = "Standard"
  allocation_method   = "Static"
  zones               = ["1", "2", "3"]
}

resource "azurerm_public_ip" "firewall_mgmt" {
  name                = "trackpulse-${var.environment}-firewall-mgmt-pip"
  resource_group_name = var.resource_group
  location            = var.location
  sku                 = "Standard"
  allocation_method   = "Static"
  zones               = ["1", "2", "3"]
}

resource "azurerm_firewall_policy" "main" {
  name                = "trackpulse-${var.environment}-firewall-policy"
  resource_group_name = var.resource_group
  location            = var.location
  sku                 = "Basic"
}

resource "azurerm_firewall" "main" {
  name                = "trackpulse-${var.environment}-firewall"
  resource_group_name = var.resource_group
  location            = var.location
  sku_name            = "AZFW_VNet"
  sku_tier            = "Basic"
  firewall_policy_id  = azurerm_firewall_policy.main.id

  ip_configuration {
    name                 = "fw-config"
    subnet_id            = var.firewall_subnet_id
    public_ip_address_id = azurerm_public_ip.firewall.id
  }

  management_ip_configuration {
    name                 = "fw-mgmt-config"
    subnet_id            = var.firewall_mgmt_subnet_id
    public_ip_address_id = azurerm_public_ip.firewall_mgmt.id
  }
}

resource "azurerm_firewall_policy_rule_collection_group" "dnat" {
  name               = "DefaultDnatRuleCollectionGroup"
  firewall_policy_id = azurerm_firewall_policy.main.id
  priority           = 100

  nat_rule_collection {
    name     = "allow-my-ip"
    priority = 100
    action   = "Dnat"

    rule {
      name                = "allow-http"
      protocols           = ["TCP"]
      source_addresses    = [var.my_ip]
      destination_address = azurerm_public_ip.firewall.ip_address
      destination_ports   = ["80"]
      translated_address  = var.aks_node_ip
      translated_port     = "30080"
    }
  }
}

resource "azurerm_firewall_policy_rule_collection_group" "network" {
  name               = "DefaultNetworkRuleCollectionGroup"
  firewall_policy_id = azurerm_firewall_policy.main.id
  priority           = 200

  network_rule_collection {
    name     = "allow-aks-outbound"
    priority = 100
    action   = "Allow"

    rule {
      name                  = "allow-internet"
      protocols             = ["TCP"]
      source_addresses      = [var.aks_subnet_cidr]
      destination_addresses = ["*"]
      destination_ports     = ["80", "443", "5432"]
    }
  }
}
