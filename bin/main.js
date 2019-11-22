#!/usr/bin/env node

const inquirer = require('inquirer');
const Gitlab = require('../lib/gitlab');
/**
 * @description initialize project info
 */
async function initProjectConfig() {
  const project = await inquirer.prompt(require('../config/project-options'));
  const gitlab = new Gitlab(project);
}

initProjectConfig();

async function queryProjectId(context) {
  const spinner = ora('正在获取项目ID...');
  spinner.start();
  const {api, token, project_name} = context;
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
    const { project_id } = await inquirer.prompt([option]);
    this.context.project_id = project_id;
  } else if (projects.length === 1) {
    this.context.project_id = projects[0].id;
  }
  spinner.succeed('获取项目ID成功!')
  return this.context;
}
