const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

async function run() {
  try {
    const image = core.getInput("image");
    const configFile = core.getInput("config-file");

    const commandOptions = [
      "run",
      "-e",
      "CI=true",
      "-e",
      "DOCKER_API_VERSION=1.37",
      "--rm",
      "--mount",
      `type=bind,source=${configFile},target=/.dive-ci`,
      "-v",
      "/var/run/docker.sock:/var/run/docker.sock",
      "wagoodman/dive:v0.9",
      "--ci-config",
      "/.dive-ci",
      image,
    ];
    let output = "";
    const execOptions = {};
    execOptions.listeners = {
      stdout: (data) => {
        output += data.toString();
      },
      stderr: (data) => {
        output += data.toString();
      },
    };
    const ret = await exec.exec("docker", commandOptions, execOptions);
    if (ret.exitCode !== 0) {
      const token = core.getInput("github-token");
      const octokit = github.getOctokit(token);
      await octokit.issues.createComment({
        ...github.context.issue,
        body: output,
      });
      core.setFailed("Scan failed");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
