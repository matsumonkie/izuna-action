import * as path from 'path';

const core = require('@actions/core');
const github = require('@actions/github');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
const exec = require('@actions/exec');

async function run() {
  try {
    const izunaBuilderVersion = "v0.1";
    const ghcVersion = core.getInput('ghcVersion');
    if (ghcVersion != "8.10.1" && ghcVersion != "8.10.2") {
      throw `Ghc version [${ghcVersion}] is non compatible with izuna-builder, please use 8.10.1 or above`;
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = github.context.payload;
    console.log(payload);
    var project = {
      user: core.getInput("owner"),
      repo: core.getInput("repository"),
      packageName: core.getInput('package'),
      commitId: payload.pull_request.head.sha
    };
    console.log(`project: ${JSON.stringify(project)}`);

    /* check if we already have izuna-builder in the cache */
    const izunaBuilderExe = "izuna-builder-exe-ghc-" + ghcVersion;
    const binDir = "./bin";
    const izunaBuilderExeFullPath = path.join(binDir, izunaBuilderExe);
    console.log(izunaBuilderExeFullPath);

    const cacheDir = tc.find(izunaBuilderExe, izunaBuilderVersion);
    if (cacheDir === '') {
      console.log("0");
      const izunaBuilderUrl = "https://github.com/matsumonkie/izuna/releases/download/" + izunaBuilderVersion + "/" + izunaBuilderExe;
      console.log(`izuna builder url: ${izunaBuilderUrl}`);

      await tc.downloadTool(izunaBuilderUrl, izunaBuilderExeFullPath);
      console.log("1");

      await exec.exec('chmod', [ '+x', izunaBuilderExeFullPath ], { silent: true });
      console.log("2");
      const cachedPath = await tc.cacheFile(izunaBuilderExeFullPath, izunaBuilderExe, izunaBuilderExe, izunaBuilderVersion);
      console.log("3");
      core.addPath(cachedPath);
      console.log("4");
    } else {
      core.addPath(cacheDir);
    }

    const hieDirectory = core.getInput('hieDirectory');
    console.log("5");
    await exec.exec('pwd', []);
    await exec.exec('ls', ["-l", izunaBuilderExeFullPath]);
    await exec.exec(izunaBuilderExeFullPath,
                    [ '--hie-directory=' + hieDirectory,
                      '--user=' + project.user,
                      '--repo=' + project.repo,
                      '--package=' + project.packageName,
                      '--commit=' + project.commitId
                    ]
                   );

    console.log("yeah!!");

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
