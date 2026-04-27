resource "azurerm_service_plan" "main" {
  name                       = "asp-trackpulse-${var.environment}"
  resource_group_name        = var.resource_group
  location                   = var.location
  os_type                    = "Linux"
  sku_name                   = var.sku_name
  app_service_environment_id = var.ase_id
}

resource "azurerm_linux_web_app" "main" {
  name                = "app-trackpulse-${var.environment}"
  resource_group_name = var.resource_group
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    health_check_path                 = "/api/health"
    health_check_eviction_time_in_min = 5

    application_stack {
      docker_image_name        = "${var.acr_login_server}/trackpulse:latest"
      docker_registry_url      = "https://${var.acr_login_server}"
      docker_registry_username = var.acr_username
      docker_registry_password = var.acr_password
    }
  }

  app_settings = {
    "DATABASE_URL"                          = var.db_url
    "NEXTAUTH_SECRET"                       = var.nextauth_secret
    "NEXTAUTH_URL"                          = "https://app-trackpulse-${var.environment}.azurewebsites.net"
    "NEXT_PUBLIC_APP_URL"                   = "https://app-trackpulse-${var.environment}.azurewebsites.net"
    "GROQ_API_KEY"                          = var.groq_api_key
    "GMAIL_USER"                            = var.gmail_user
    "GMAIL_APP_PASSWORD"                    = var.gmail_app_password
    "EMAIL_FROM"                            = "TrackPulse <${var.gmail_user}>"
    "AZURE_STORAGE_CONNECTION_STRING"       = var.storage_conn_string
    "AZURE_STORAGE_CONTAINER"               = "trackpulse"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.app_insights_connection_string
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE"   = "false"
    "WEBSITES_PORT"                         = "8080"
    "PORT"                                  = "8080"
    "NODE_ENV"                              = "production"
  }

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 100
      }
    }
  }
}
