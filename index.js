import * as path from 'path';

const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

async function run() {
  try {
    var project = {
      user: core.getInput("owner"),
      repo: core.getInput("repository"),
      packageName: core.getInput('package'),
      ghcVersion: core.getInput('ghcVersion'),
      hieDirectory: core.getInput('hieDirectory'),
      commitId: github.context.payload.pull_request.head.sha
    };
    console.log(`project: ${JSON.stringify(project)}`);

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
    await exec.exec('curl', [ "--form",
                              '--file=@' + tarName,
                              izunaBuilderUrl
                            ]
                   );
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
