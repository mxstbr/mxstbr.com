workflow "Deploy to Now" {
  on = "push"
  resolves = [
    "Alias",
    "Filter out master branch",
  ]
}

action "Deploy" {
  uses = "actions/zeit-now@master"
  secrets = ["ZEIT_TOKEN"]
  args = "--team mxstbr --no-clipboard > $HOME/deploy.txt"
}

action "Alias" {
  uses = "actions/zeit-now@master"
  args = "alias --team mxstbr `cat /github/home/deploy.txt`"
  secrets = ["ZEIT_TOKEN"]
  needs = ["Filter out master branch"]
}

action "Filter out master branch" {
  uses = "actions/bin/filter@master"
  needs = ["Deploy"]
  args = "branch master"
}
