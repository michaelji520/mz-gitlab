#!/usr/bin/env node
const chalk = require('chalk');
const inquirer = require('inquirer');
const execa = require('execa');
const ora = require('ora');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const Gitlab = require('../lib/gitlab');
const operation_options = require('../config/operation-options');
const toolset = require('../lib/util');

main();

async function main() {
  const config = await initProjectConfig('gitlab.config.js');
  execGitlabCommand(config);
}

/**
 * @description execute gitlab operations chosen by user
 * @param {object} context gitlab project config
 */
async function execGitlabCommand(context) {
  const gitlab = new Gitlab(context);
  const { operation } = await inquirer.prompt(operation_options.operations);
  let params = '';
  switch (operation) {
    case 'merge':
      params = await inquirer.prompt(operation_options[operation]);
      const spinner = ora('Launching merge request...');
      spinner.start();
      try {
        const result = await gitlab.createMergeRequest(params);
        if (!result) {
          throw new Error('Failed to create merge request.');
        }
        spinner.succeed('Merge request sent!');
        if (context.webhook) {
          const { state, web_url, author } = result;
          let data = {
            'msgtype': 'markdown',
            'markdown': {
                'title': `Gitlab: ${author.username} open the merge request from ${params.source_branch} to ${params.target_branch}`,
                'text': `#### ${author.username} open the merge request from ${params.source_branch} to ${params.target_branch} \n` +
                        `> Repository: ${context.project_name} \n\n` +
                        `> Status: ${state} \n\n` +
                        `> Title: [${params.title}](${web_url}) \n`
            }
          };
          await toolset.sendWebhookMessage(context.webhook, data);
        }
      } catch(err) {
        console.log(err);
      }
      break;
    case 'branch':
      params = await inquirer.prompt(operation_options[operation]);
      if (await gitlab.createRepositoryBranch(params)) {
        const spinner = ora(`Fetching remote branch: ${params.branch}`);
        spinner.start();
        console.log((await execa(`git fetch origin ${params.branch}`)).stdout);
        spinner.succeed(`Fetch remote branch ${params.branch} succeeded!`);
        console.log((await execa(`git checkout ${params.branch}`)).stdout);
      }
      break;
  }
}

/**
 * @description initialize project info
 * @param {string} config_file project config file name
 */
async function initProjectConfig(config_file) {
  const cwd = process.cwd();
  const target = path.resolve(cwd, config_file);
  let config = '';
  if (fs.existsSync(target)) {
    config = require(target);
  } else {
    let project = await inquirer.prompt(require('../config/project-options'));

    let spinner = ora('Querying project id...');
    spinner.start();
    project.project_id = await queryProjectId(project);
    spinner.succeed('Get project id successfully!')
    spinner = ora(`Writing project config to local file: ${config_file}`);
    fs.writeFileSync(target, 'module.exports = ' + util.inspect(project, { depth: null }), 'utf-8');
    toolset.addFile2GitIgnore(config_file);
    spinner.succeed(`Project config has been saved to ${target}.`)
    config = project;
  }
  return config;
}


/**
 * @description Obtain project_id
 * @param {object} context project basic info
 */
async function queryProjectId(context) {
  const {api, token, project_name} = context;
  let project_id = '';
  const response = await axios.get(`${api}/projects?private_token=${token}&search=${project_name}`)
  const projects = response.data;
  if (projects.length > 1) {
    let option = {
      type: 'list',
      name: 'project_id',
      message: 'Choose your project:',
      choices: projects.map((i) => {
        return {
          name: `${i.name_with_namespace}`,
          value: i.id
        };
      }),
      validate: function (val) {
        return !!val;
      }
    }
    project_id = await inquirer.prompt([option]);
  } else if (projects.length === 1) {
    project_id = projects[0].id;
  }
  return project_id;
}
