// find the key with the minimum value for an object
const min_key = (obj) =>
  Object.keys(obj).reduce((key, v) => (obj[v] < obj[key] ? v : key))

module.exports = async ({ github, context, core }) => {
  // dump the context
  core.startGroup("action context")
  console.log(context)
  core.endGroup()

  const pr = context.payload.number
  const actor = context.actor
  console.log("pr #", pr)
  console.log("actor", actor)

  // get open PRs on this repo
  // + get list of contributors to this repo
  const [pullsResp, contributorsResp, collaboratorsResp] = await Promise.all([
    github.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 100,
    }),
    github.repos.listContributors({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 100,
    }),
    github.repos.listCollaborators({
      owner: context.repo.owner,
      repo: context.repo.repo,
      per_page: 100,
    }),
  ])
  const pulls = pullsResp.data
  const open_prs = pulls.length

  core.startGroup("collaborators")
  console.log(collaboratorsResp.data)
  core.endGroup()

  // filter out [bot] users
  const contributors = contributorsResp.data
    .map((c) => c.login)
    .filter((c) => !c.match(/\[bot\]/))

  // list of reviewers for each PR
  const reviewers_per_pull = pulls
    .map((pull) => pull.requested_reviewers)
    .map((reviewers) => reviewers.map((r) => r.login))

  // consolidate to map: reviewer => # of reviews
  const reviews_per_reviewer = {}
  reviewers_per_pull.flat(1).forEach((v) => {
    if (v in reviews_per_reviewer) {
      reviews_per_reviewer[v] += 1
    } else {
      reviews_per_reviewer[v] = 1
    }
  })

  // add in contributors with zero open reviews
  contributors.forEach((v) => {
    if (!(v in reviews_per_reviewer)) reviews_per_reviewer[v] = 0
  })

  // remove the PR owner from contention
  if (actor in reviews_per_reviewer) delete reviews_per_reviewer[actor]

  // filter out contributors that are not collaborators
  const collaborators = collaboratorsResp.data.map((c) => c.login)
  for (user in reviews_per_reviewer)
    if (!(login in contributors)) delete reviews_per_reviewer[user]

  const min_reviewer = min_key(reviews_per_reviewer)

  console.log("reviews per reviewer:", reviews_per_reviewer)
  console.log("assigning review to", min_reviewer)

  core.setOutput("reviewer", min_reviewer)
  core.setOutput("open_prs", open_prs)

  const requestReviewersResp = await github.pulls.requestReviewers({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pr,
    reviewers: [min_reviewer],
  })

  return min_reviewer
}
