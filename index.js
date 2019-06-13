#!/usr/bin/env node

/**
 * Copyright (c) 2014-2019 NighthawkStudio, All rights reserved.
 * @fileoverview
 * @author Michael Zhang | michaelji520@gmail.com
 * @version 1.0 | 2019-05-27 | initial version
 */

// required modules
const https = require('https');
const path = require('path');
const url = require('url');
const fs = require('fs');
const readline = require('readline');
const process = require('process');
const child_process = require('child_process');

const help = require('./help.js');

// 配置文件的绝对路径
const file = path.resolve('./gitlab_config.js');

const git_ignore = path.resolve('./.gitignore');

const initConfig = `
/**
 * Gitlab工作流配置文件
 */

module.exports={
  // 项目名称, 必需参数, eg. helloworld
  project_name: '',
  // 开发者Gitlab Token, 访问Gitlab服务器地址 -> Settings -> Access Tokens -> 生成Personal Access Tokens
  token: '',
  // Gitlab api地址
  api: ''
}`;

function addConfigToGitIgnore(git_ignore) {
  return new Promise((resolve, reject) => {
    fs && fs.appendFile(git_ignore, 'gitlab_config.js', (err) => {
      if (err) throw err;
      resolve(true);
    });
  });
}

// 提示并退出程序
function exit(str = '') {
  console.log(str);
  process && process.exit(1);
}

// 写入内容到指定文件中
function writeConfigToFile(file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, (err) => {
      if (err) {
        throw err;
      }
      resolve(true);
    });
  });
}

// 创建初始配置文件
async function createConfigFile(file, initConfig) {
  return new Promise(async (resolve, reject) => {
    const res = await writeConfigToFile(file, initConfig);
    if (res) {
      resolve(true);
    }
    resolve(false);
  });
}

// 检查当前项目目录下是否存在配置文件
// 如果有, 检测必需参数并返回
// 否则, 提示用户填写配置信息
async function checkAndInitConfig() {
  return new Promise((resolve, reject) => {
    let config = '';
    fs.access(file, async (err) => {
      if (err) {
        await createConfigFile(file, initConfig);
        await addConfigToGitIgnore(git_ignore);
        exit('\n请先填写项目目录下的配置文件: gitlab_config.js');
      } else {
        config = require(file);
        if (!(config.project_name && config.token && config.api)) {
          exit('\n请先填写项目目录下的配置文件: gitlab_config.js');
        }
      }
      resolve(config);
    });
  });
}


// 获取merge必需参数并返回: 源分支, 目标分支, 标题
function getMergeParams() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let source_branch = '';
    let target_branch = '';
    let title = '';
    let default_target = 'dev';
    let default_title = '';
    rl.setPrompt('\n请输入源分支: ');
    rl.prompt();
    rl.on('line', function (line) {
      if (!source_branch && line) {
        source_branch = line;
        rl.setPrompt(`请选择目标分支(${default_target}): `);
        rl.prompt();
      } else if (source_branch && !target_branch) {
        target_branch = line || default_target;
        default_title = `merge ${source_branch} into ${target_branch}`;
        rl.setPrompt(`请设置标题(${default_title}): `);
        rl.prompt();
      } else if (target_branch && !title) {
        title = line || default_title;
        rl.close();
      } else {
        rl.prompt();
      }
    }).on('close', () => {
      resolve({target_branch, source_branch, title});
    });
  });
}

// 获取创建分支所需参数: 新分支名, 源分支
function getBranchParams() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let branch = '';
    let ref = '';
    let default_ref = 'dev';
    rl.setPrompt(`\n请输入源分支(${default_ref}): `);
    rl.prompt();
    rl.on('line', function (line) {
      if (!ref) {
        ref = line || default_ref;
        rl.setPrompt(`请输入新分支名: `);
        rl.prompt();
      } else if (!branch && line) {
        branch = line;
        rl.close();
      } else {
        rl.prompt();
      }
    }).on('close', () => {
      resolve({ref, branch});
    });
  });
}

// 根据项目名称, token, api获取项目ID
function getProjectId({api, token, project_name}) {
  return new Promise((resolve, reject) => {
    https.get(`${api}/projects?private_token=${token}&search=${project_name}`, (res) => {
      var result = '';
      res.on('data', (chunk) => {
        result += chunk;
      })
      res.on('end', () => {
        let projects = JSON.parse(result.toString());
        let project_id = '';
        if (projects && projects.length) {
          project_id = projects[0].id || '';
        }
        const data = `module.exports={
          project_name: \'${project_name}\',
          project_id: ${project_id},
          token: \'${token}\',
          api: \'${api}\'
        }`;
        resolve(project_id);
      });
    }).on('error', (e) => {
      console.error(e);
    });
  });
}

var gitlab = function ({api = '', token = '', project_id = ''}) {
  // private
  var api = api || '';
  var private_token = token || '';
  var project_id = project_id || '';

  // 检查配置信息
  function checkInitParams() {
    return api && private_token && project_id;
  }

  // public
  // 创建 Merge Request
  this.createMergeRequest = async function (params) {
    if (!checkInitParams()) {
      return false;
    }
    if (!(params && params.source_branch && params.target_branch && params.title)) {
      console.log('Missing required parameters, please check your input.');
      return false;
    }
    let message = JSON.stringify({
      id: project_id,
      source_branch: params.source_branch,
      target_branch: params.target_branch,
      title: params.title,
      private_token: private_token
    });
    let request_url = url.parse(api);
    let options = {
      hostname: request_url.hostname,
      port: params.port || 443,
      path: `${request_url.path}/projects/${project_id}/merge_requests`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(message)
      }
    };
    const result = await Service.post(message, options);
    console.log('');
    if (result.message) {
      console.log(result.message);
    } else {
      console.log(`Request to merge ${result.source_branch} into ${result.target_branch} has been created!`);
      console.log(`Web url: ${result.web_url}`);
    }
    process.exit(0);
  }

  // 创建新分支
  this.createRepositoryBranch = async function (params) {
    if (!(params.branch && params.ref && checkInitParams())) {
      console.log('Missing required parameters, please check your input.');
      return false;
    }
    let message = JSON.stringify(Object.assign({}, params, {
      id: project_id,
      private_token: private_token
    }));
    let request_url = url.parse(api);
    let options = {
      hostname: request_url.hostname,
      port: 443,
      path: `${request_url.path}/projects/${project_id}/repository/branches`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(message)
      }
    };
    const result = await Service.post(message, options);
    if (result && result.name) {
      console.log('\n正在拉取远程分支到本地...');
      child_process.execSync(`git fetch origin ${params.branch}`);
      child_process.execSync(`git checkout ${params.branch}`);
    }
    process.exit(0);
  }
}

// 异步请求服务封装, POST
const Service = {
  post: async function (message, options) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        var result = [];
        var size = 0;
        res.on('data', (chunk) => {
          result += chunk;
        })
        res.on('end', () => {
          if (result) {
            result = JSON.parse(result);
            resolve(result);
          }
        });
        res.on('error', (e) => {
          reject(e);
        });
      });
      req.on('error', (e) => {
        reject(e);
      });
      req.write(message);
      req.end();
    });
  }
};

async function launch() {
  let config = await checkAndInitConfig();
  if (!(config && config.project_id)) {
    config.project_id = await getProjectId(config);
  }
  let params = process.argv.splice(2);
  if (!params.length) {
    exit(help);
  }
  var gl = new gitlab(config);
  if (params[0] === 'merge') {
    const merge_params = await getMergeParams();
    gl.createMergeRequest(merge_params);
  } else if (params[0] === 'branch') {
    const branch_params = await getBranchParams();
    gl.createRepositoryBranch(branch_params);
  }
}

launch();
