workflow "Deploy to Now" {
  on = "push"
  resolves = ["Deploy"]
}

action "Deploy" {
  uses = "primer/deploy@v2.0.0"
  args = "-- --team mxstbr"
  secrets = [
    "GITHUB_TOKEN",
    "NOW_TOKEN",
  ]
}
