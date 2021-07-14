# Auto Assign Reviewer

## Using this action

Example workflow

```yaml
name: Auto Assign Reviewer

on:
  pull_request:
    types: [opened]

jobs:
  assign:
    steps:
    - name: Assign Reviewer
      uses: bondhouse/auto-assign-reviewers@main
```

This will automatically assign the contributor with the fewest requested reviews as the reviewer on the pull request. It will only consider contributors that have been active in the past 2 weeks. 
