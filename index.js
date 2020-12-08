const core = require('@actions/core');
const github = require('@actions/github');

try {
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = github.context.payload;
  console.log(`payload: ${payload}`);
  console.log(`owner: ${payload.repository.owner}`);

  var project = {
    owner: payload.repository.owner.name,
    repo: payload.repository.name,
    packageName: core.getInput('packageName'),
    commitId: payload.head_commit.id
  };

  console.log(`project: ${JSON.stringify(project)}`);
} catch (error) {
  core.setFailed(error.message);
}
