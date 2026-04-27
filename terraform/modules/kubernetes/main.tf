resource "kubernetes_namespace" "main" {
  metadata { name = "trackpulse" }
}

resource "kubernetes_secret" "app" {
  metadata {
    name      = "trackpulse-secrets"
    namespace = kubernetes_namespace.main.metadata[0].name
  }
  data = {
    DATABASE_URL                          = var.db_url
    NEXTAUTH_SECRET                       = var.nextauth_secret
    GROQ_API_KEY                          = var.groq_api_key
    GMAIL_USER                            = var.gmail_user
    GMAIL_APP_PASSWORD                    = var.gmail_app_password
    AZURE_STORAGE_CONNECTION_STRING       = var.storage_conn_string
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.app_insights_connection_string
  }
}

resource "kubernetes_secret" "acr_pull" {
  metadata {
    name      = "acr-pull-secret"
    namespace = kubernetes_namespace.main.metadata[0].name
  }
  type = "kubernetes.io/dockerconfigjson"
  data = {
    ".dockerconfigjson" = jsonencode({
      auths = {
        "${var.acr_login_server}" = {
          username = var.acr_username
          password = var.acr_password
          auth     = base64encode("${var.acr_username}:${var.acr_password}")
        }
      }
    })
  }
}

resource "kubernetes_config_map" "app" {
  metadata {
    name      = "trackpulse-config"
    namespace = kubernetes_namespace.main.metadata[0].name
  }
  data = {
    NODE_ENV                = "production"
    NEXTAUTH_URL            = var.app_url
    NEXT_PUBLIC_APP_URL     = var.app_url
    AZURE_STORAGE_CONTAINER = "trackpulse"
    EMAIL_FROM              = "TrackPulse <${var.gmail_user}>"
    PORT                    = "8080"
    HOSTNAME                = "0.0.0.0"
  }
}

resource "kubernetes_deployment" "app" {
  metadata {
    name      = "trackpulse"
    namespace = kubernetes_namespace.main.metadata[0].name
  }

  wait_for_rollout = false

  spec {
    replicas = 1
    selector { match_labels = { app = "trackpulse" } }

    template {
      metadata { labels = { app = "trackpulse" } }

      spec {
        image_pull_secrets { name = kubernetes_secret.acr_pull.metadata[0].name }

        init_container {
          name              = "db-migrate"
          image             = "${var.acr_login_server}/trackpulse:latest"
          image_pull_policy = "Always"
          command           = ["node", "/app/node_modules/prisma/build/index.js", "db", "push", "--accept-data-loss"]

          env_from {
            config_map_ref { name = kubernetes_config_map.app.metadata[0].name }
          }

          dynamic "env" {
            for_each = {
              DATABASE_URL                          = "DATABASE_URL"
              NEXTAUTH_SECRET                       = "NEXTAUTH_SECRET"
              GROQ_API_KEY                          = "GROQ_API_KEY"
              GMAIL_USER                            = "GMAIL_USER"
              GMAIL_APP_PASSWORD                    = "GMAIL_APP_PASSWORD"
              AZURE_STORAGE_CONNECTION_STRING       = "AZURE_STORAGE_CONNECTION_STRING"
              APPLICATIONINSIGHTS_CONNECTION_STRING = "APPLICATIONINSIGHTS_CONNECTION_STRING"
            }
            content {
              name = env.key
              value_from {
                secret_key_ref {
                  name = kubernetes_secret.app.metadata[0].name
                  key  = env.value
                }
              }
            }
          }
        }

        container {
          name              = "trackpulse"
          image             = "${var.acr_login_server}/trackpulse:latest"
          image_pull_policy = "Always"

          port { container_port = 8080 }

          env_from {
            config_map_ref { name = kubernetes_config_map.app.metadata[0].name }
          }

          dynamic "env" {
            for_each = {
              DATABASE_URL                          = "DATABASE_URL"
              NEXTAUTH_SECRET                       = "NEXTAUTH_SECRET"
              GROQ_API_KEY                          = "GROQ_API_KEY"
              GMAIL_USER                            = "GMAIL_USER"
              GMAIL_APP_PASSWORD                    = "GMAIL_APP_PASSWORD"
              AZURE_STORAGE_CONNECTION_STRING       = "AZURE_STORAGE_CONNECTION_STRING"
              APPLICATIONINSIGHTS_CONNECTION_STRING = "APPLICATIONINSIGHTS_CONNECTION_STRING"
            }
            content {
              name = env.key
              value_from {
                secret_key_ref {
                  name = kubernetes_secret.app.metadata[0].name
                  key  = env.value
                }
              }
            }
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = 8080
            }
            initial_delay_seconds = 15
            period_seconds        = 10
            failure_threshold     = 3
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = 8080
            }
            initial_delay_seconds = 30
            period_seconds        = 20
            failure_threshold     = 3
          }

          resources {
            requests = { memory = "512Mi", cpu = "250m" }
            limits   = { memory = "1Gi",   cpu = "1000m" }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "app" {
  metadata {
    name      = "trackpulse-service"
    namespace = kubernetes_namespace.main.metadata[0].name
  }
  spec {
    selector = { app = "trackpulse" }
    type     = "LoadBalancer"
    port {
      port        = 80
      target_port = 8080
    }
  }
}
