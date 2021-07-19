const core = require("@actions/core")
const { context, getOctokit } = require("@actions/github")
const assign = require("./auto-assign-reviewer")

// most @actions toolkit packages have async methods
async function run() {
  try {
    const token = core.getInput("github-token", { required: true })
    let github = getOctokit(token, {})

    if (!github) {
      throw new Error("unable to get GitHub client")
    }
    github = github.rest

    try {
      assign({ github, context, core })
    } catch (error) {
      console.error("unable to auto assign reviewer:", error)
      process.exit(1)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
