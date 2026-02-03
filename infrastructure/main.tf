data "azurerm_client_config" "current" {}

resource "azuread_application" "main" {
  display_name = "Cirrus Maintenance Operations"

  single_page_application {
    redirect_uris = ["http://localhost:3000/"]
  }

  password {
    display_name = "Web App"
  }
}

output "azure_ad_client_id" {
  description = "Azure AD Application (Client) ID"
  value       = azuread_application.main.client_id
}

output "azure_ad_object_id" {
  description = "Azure AD Application Object ID"
  value       = azuread_application.main.object_id
}

output "tenant_id" {
  description = "Azure AD Tenant ID"
  value       = data.azurerm_client_config.current.tenant_id
}