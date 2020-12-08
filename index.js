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
    var project = {
      owner: payload.repository.owner.name,
      repo: payload.repository.name,
      packageName: core.getInput('packageName'),
      commitId: payload.head_commit.id
    };
    console.log(`project: ${JSON.stringify(project)}`);

    /* check if we already have izuna-builder in the cache */
    const izunaBuilderExe = "izuna-builder-exe-ghc-" + ghcVersion;
    const cacheDir = tc.find(izunaBuilderExe, izunaBuilderVersion);
    if (cacheDir === '') {
      const izunaBuilderUrl = "https://github.com/matsumonkie/izuna/releases/download/" + izunaBuilderVersion + "/" + izunaBuilderExe;
      console.log(`izuna builder url: ${izunaBuilderUrl}`);
      const binDir = "./bin";
      await tc.downloadTool(izunaBuilderUrl, binDir);
      console.log(binDir + '/' + izunaBuilderExe);

      console.log ("AAA");
      let myOutput = ''
      const options = { listeners: { stdout: (data) => { myOutput += data.toString() } } };
      exec.exec('ls', [binDir], options);
      console.log("res1: " + myOutput);

      let myOutput2 = "";
      const options2 = { listeners: { stdout: (data) => { myOutput2 += data.toString() } } };
      exec.exec('ls', ["."], options2);
      console.log("res2: " + myOutput2);

      let myOutput3 = "";
      const options3 = { listeners: { stdout: (data) => { myOutput3 += data.toString() } } };
      exec.exec('ls', [binDir + "/*"], options3);
      console.log("res3: " + myOutput3);

      console.log ("BBB");

      exec.exec('chmod', ['+x', binDir + '/' + izunaBuilderExe], { silent: true });
      const cachedPath = await tc.cacheFile(binDir, izunaBuilderExe, izunaBuilderExe, izunaBuilderVersion);
      core.addPath(cachedPath);
    } else {
      core.addPath(cacheDir);
    }

    await exec.exec(izunaBuilderExe,
                    [ '--hie-directory=.',
                      '--user=' + project.user,
                      '--repo=' + project.repo,
                      '--package=' + project.packageName,
                      '--commit=' + project.commitId
                    ]
                   );

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
