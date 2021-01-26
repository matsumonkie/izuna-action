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
    console.log("creating archive");
    const tarName = "izuna.tar";
    const success = await createTar(project, tarName);
    if(success) {
      console.log("sending archive");
      await sendTarToIzuna(project, tarName);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function createTar(project, tarName) {
  try {
    await exec.exec('tar', [ "--create", "--file=" + tarName, project.hieDirectory ]);
    return true;
  } catch(error) {
    core.setFailed('Could not create tar archive for izuna. Either the hieDirectory parameter is wrong or the hie files were not generated');
    return false;
  }
}

async function sendTarToIzuna(project, tarName) {
  const ghcVersion = project.ghcVersion.replace(/\./g, "");
  const baseUrl = 'https://izuna-builder.izuna.app';
  const pathname = path.join("/api",
                             "projectInfo",
                             ghcVersion,
                             project.user,
                             project.repo,
                             project.commitId,
                             project.projectRoot
                            );
  const url = baseUrl + pathname;
  const form = new FormData();
  form.append(tarName, fs.createReadStream(tarName));
  try {
    const response = await axios.post(url, form)
    if(response.status === 200) {
      return true;
    } else {
      core.setFailed(`Could not upload project information to izuna server, url: ${url}, response: ${response}`);
      return false;
    }
  } catch(error) {
    core.setFailed(`Could not upload project information to izuna server, url: ${url}, error: ${error}`);
    return false;
  }
}

run();
