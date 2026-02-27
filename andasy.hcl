app_name = "openway"

app {
  port = 3000

  compute {
    cpu    = 1
    memory = 512
    cpu_kind = "shared"
  }

  process {
    name = "app"
  }
}
