import * as path from 'path';

const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

function getCommitId() {
  if(github.context &&
     github.context.payload &&
     github.context.payload.pull_request &&
     github.context.payload.pull_request.head &&
     github.context.payload.pull_request.head.sha) {
    // we are in a pull request context
    return github.context.payload.pull_request.head.sha;
  } else if (github.context && github.context.eventName === 'push' && github.context.sha) {
    // when we are pushing a commit outside of a PR (e.g: merging a branch)
    return github.context.sha;
  }
}

async function run() {
  try {
    const [user, repo] = process.env.GITHUB_REPOSITORY.split('/');

    var project = {
      user: user,
      repo: repo,
      ghcVersion: core.getInput('ghcVersion'),
      hieDirectory: core.getInput('hieDirectory'),
      projectRoot: core.getInput('projectRoot'),
      commitId: getCommitId()
    };
    console.log(`project: ${JSON.stringify(project)}`);
    if (project.ghcVersion != "8.10.1" && project.ghcVersion != "8.10.2") {
      throw `Ghc version [${project.ghcVersion}] is non compatible with izuna-builder, please use 8.10.1 or above`;
    }
    const tarName = "izuna.tar";
    await createTar(project, tarName);
    await sendTarToIzuna(project, tarName);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function createTar(project, tarName) {
  try {
    await exec.exec('tar', [ "--create", "--file=" + tarName, project.hieDirectory ]);
  } catch(error) {
    core.setFailed('Could not create tar archive for izuna. Either the hieDirectory parameter is wrong or the hie files were not generated');
  }
}

async function sendTarToIzuna(project, tarName) {
  const ghcVersion = project.ghcVersion.replace(/\./g, "");
  const izunaBuilderUrl = path.join( "https://izuna-builder.izuna.app",
                                     "api",
                                     "projectInfo2",
                                     ghcVersion,
                                     project.user,
                                     project.repo,
                                     project.commitId,
                                     project.projectRoot
                                   );

  const form = new FormData();
  form.append(tarName, fs.createReadStream(tarName));
  await axios
    .post(izunaBuilderUrl, form)
    .then((response) => {
      if(response.status !== 200) {
        console.error("Could not upload project information to izuna server");
        throw "Could not upload project information to izuna server";
      }
    });
}

run();
