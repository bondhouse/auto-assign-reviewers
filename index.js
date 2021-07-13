const core = require("@actions/core")
const { context, getOctokit } = require("@actions/github")
const assign = require("./auto-assign-reviewer")

// most @actions toolkit packages have async methods
async function run() {
  try {
    const token = core.getInput("github-token", {required: true})
    const github = getOctokit(token, {})
    assign({
      github.rest,
      context,
      core,
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
