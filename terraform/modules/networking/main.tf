resource "azurerm_virtual_network" "main" {
  name                = "trackpulse-${var.environment}-vnet"
  resource_group_name = var.resource_group
  location            = var.location
  address_space       = [var.vnet_cidr]
}

resource "azurerm_subnet" "firewall" {
  name                 = "AzureFirewallSubnet"
  resource_group_name  = var.resource_group
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.firewall_subnet_cidr]
}

resource "azurerm_subnet" "firewall_mgmt" {
  name                 = "AzureFirewallManagementSubnet"
  resource_group_name  = var.resource_group
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.firewall_mgmt_subnet_cidr]
}

resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = var.resource_group
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.aks_subnet_cidr]
}

resource "azurerm_subnet" "db" {
  name                              = "db-subnet"
  resource_group_name               = var.resource_group
  virtual_network_name              = azurerm_virtual_network.main.name
  address_prefixes                  = [var.db_subnet_cidr]
  private_endpoint_network_policies = "Disabled"
}

resource "azurerm_subnet" "storage" {
  name                              = "storage-subnet"
  resource_group_name               = var.resource_group
  virtual_network_name              = azurerm_virtual_network.main.name
  address_prefixes                  = [var.storage_subnet_cidr]
  private_endpoint_network_policies = "Disabled"
}

resource "azurerm_route_table" "main" {
  name                = "trackpulse-${var.environment}-route-table"
  resource_group_name = var.resource_group
  location            = var.location

  route {
    name                   = "force-through-firewall"
    address_prefix         = "0.0.0.0/0"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = cidrhost(var.firewall_subnet_cidr, 4)
  }
}

resource "azurerm_subnet_route_table_association" "aks" {
  subnet_id      = azurerm_subnet.aks.id
  route_table_id = azurerm_route_table.main.id
}

resource "azurerm_network_security_group" "db" {
  name                = "trackpulse-${var.environment}-db-nsg"
  resource_group_name = var.resource_group
  location            = var.location

  security_rule {
    name                       = "allow-from-aks"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = var.aks_subnet_cidr
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_ranges    = ["5432"]
  }

  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "*"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = azurerm_subnet.db.id
  network_security_group_id = azurerm_network_security_group.db.id
}

resource "azurerm_network_security_group" "storage" {
  name                = "trackpulse-${var.environment}-storage-nsg"
  resource_group_name = var.resource_group
  location            = var.location

  security_rule {
    name                       = "allow-from-aks"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = var.aks_subnet_cidr
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_ranges    = ["443"]
  }

  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "*"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "storage" {
  subnet_id                 = azurerm_subnet.storage.id
  network_security_group_id = azurerm_network_security_group.storage.id
}
