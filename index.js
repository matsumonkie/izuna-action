import * as path from 'path';

const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

function getCommitId() {
  if(github.context &&
     github.context.payload &&
     github.context.payload.pull_request &&
     github.context.payload.pull_request.head &&
     github.context.payload.pull_request.head.sha) {
    // we are in a pull request context
    return github.context.payload.pull_request.head.sha;
  } else {
    // we are merging are pull request
    return github.sha;
  }
}

async function run() {
  try {
    const [user, repo] = process.env.GITHUB_REPOSITORY.split('/');

    var project = {
      user: user,
      repo: repo,
      packageName: core.getInput('package'),
      ghcVersion: core.getInput('ghcVersion'),
      hieDirectory: core.getInput('hieDirectory'),
      commitId: getCommitId()
    };
    console.log(`project: ${JSON.stringify(project)}`);
    console.log(`project: ${JSON.stringify(process.env)}`);
    if (project.ghcVersion != "8.10.1" && project.ghcVersion != "8.10.2") {
      throw `Ghc version [${project.ghcVersion}] is non compatible with izuna-builder, please use 8.10.1 or above`;
    }

    const tarName = "izuna.tar";
    await exec.exec('tar', [ "--create",
                             "--file=" + tarName,
                             project.hieDirectory
                           ]
                   );

    const izunaBuilderUrl = "https://izuna-builder.patchgirl.io/api/" + project.ghcVersion.replace(/\./g, "") + "/projectInfo/" + project.user + "/" + project.repo + "/" + project.packageName + "/" + project.commitId;
    exec.exec('curl', [ "--form",
                        '--file=@' + tarName,
                        izunaBuilderUrl
                      ]
             ).then(_ => console.log("\nhie files were successfuly uploaded to izuna!"));
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
