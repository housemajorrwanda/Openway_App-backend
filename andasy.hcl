# andasy.hcl app configuration file generated for openway on Tuesday, 03-Mar-26 20:47:00 CAT
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "openway"

app {

  env = {}

  port = 3000

  compute {
    cpu      = 1
    memory   = 1024
    cpu_kind = "shared"
  }

  process {
    name = "openway"
  }

}
