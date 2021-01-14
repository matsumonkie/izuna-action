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
      packageName: core.getInput('package'),
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
    await exec.exec('tar', [ "--create",
                             "--file=" + tarName,
                             project.hieDirectory
                           ]
                   );

    const ghcVersion = project.ghcVersion.replace(/\./g, "");
    const izunaBuilderUrl = path.join( "https://izuna-builder.izuna.app",
                                       "api",
                                       "projectInfo",
                                       ghcVersion,
                                       project.user,
                                       project.repo,
                                       project.packageName,
                                       project.commitId,
                                       project.projectRoot
                                     );
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
