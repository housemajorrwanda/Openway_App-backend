app_name = "openway"

app {
  port = 3000

  compute {
    cpu    = 1
    memory = 1024
    cpu_kind = "shared"
  }

  process {
    name = "app"
  }
}
