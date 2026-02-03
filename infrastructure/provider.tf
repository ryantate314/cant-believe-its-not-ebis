terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }

    azuread = {
      source = "hashicorp/azuread"
    }
  }
}

provider azurerm {
  features {}
  subscription_id = var.subscription_id
}

provider azuread {
}