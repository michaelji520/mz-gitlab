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

main();

async function main() {
  const config = await initProjectConfig();
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
      break;
    case 'branch':
      params = await inquirer.prompt(operation_options[operation]);
      console.log(params)
      if (await gitlab.createRepositoryBranch(params)) {
        const spinner = ora('正在拉取远程分支...');
        spinner.start();
        console.log((await execa(`git fetch origin ${params.branch}`)).stdout);
        spinner.succeed('拉取远程分支成功!');
        console.log((await execa(`git checkout ${params.branch}`)).stdout);
      }
      break;
  }
}

/**
 * @description initialize project info
 */
async function initProjectConfig() {
  const cwd = process.cwd();
  const target = path.resolve(cwd, 'gitlab.config.js');
  let config = '';
  if (fs.existsSync(target)) {
    config = require(target);
  } else {
    let project = await inquirer.prompt(require('../config/project-options'));
    project.project_id = await queryProjectId(project);
    const spinner = ora('正在将项目信息写入到配置文件...');
    fs.writeFileSync(target, 'module.exports = ' + util.inspect(project, { depth: null }), 'utf-8');
    spinner.succeed(`项目配置已写入到${target}中.`)
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
  const spinner = ora('正在获取项目ID...');
  spinner.start();
  const response = await axios.get(`${api}/projects?private_token=${token}&search=${project_name}`)
  const projects = response.data;
  if (projects.length > 1) {
    let option = {
      type: 'list',
      name: 'project_id',
      message: '请选择您的项目:',
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
  spinner.succeed('获取项目ID成功!')
  return project_id;
}
