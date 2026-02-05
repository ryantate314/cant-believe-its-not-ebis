variable "subscription_id" {
  type = string
}

variable "location" {
  type    = string
  default = "East US 2"
}

variable "project" {
  type    = string
  default = "cirrusmro"
}

variable "environment" {
  type    = string
  default = "dev"
}