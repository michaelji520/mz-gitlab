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

const initConfig = `
/**
 * Gitlab工作流配置文件
 */

module.exports={
  // 项目名称, 必需参数
  project_name: '',
  // 开发者Gitlab Token, 访问Gitlab服务器地址 -> Settings -> Access Tokens -> 生成Personal Access Tokens
  token: '',
  // Gitlab api地址
  api: ''
}`;

console.log(__dirname);

// 配置文件的绝对路径
var file = path.resolve('./gitlab_config.js');


// 提示并退出程序
function exit(str = '') {
  console.log(str);
  process && process.exit(1);
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
        exit('请先填写项目目录下的配置文件:gitlab_config.js');
      } else {
        config = require(file);
        if (!(config.project_name && config.token && config.api)) {
          exit('请先填写项目目录下的配置文件:gitlab_config.js');
        }
      }
      resolve(config);
    });
  });
}

function getMergeParams() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let source_branch = '';
    let target_branch = '';
    let title = '';
    let isNecessary = true;
    rl.setPrompt('请选择源分支: ');
    rl.prompt();
    rl.on('line', function (line) {
      if (line && isNecessary) {
        if (!source_branch) {
          source_branch = line;
          isNecessary = false;
          rl.setPrompt(`请选择目标分支(${target_branch}): `);
          rl.prompt();
        } else if (!target_branch) {
          target_branch = line || 'dev';
          let default_title = `merge ${source_branch} into ${target_branch}`;
          rl.setPrompt(`请设置标题(${default_title}): `);
          rl.prompt();
        } else {
          title = line || default_title;
          rl.close();
        }
      } else {
        rl.prompt();
      }
    }).on('close', () => {
      resolve({target_branch, source_branch, title});
    });
  });
}

async function launch() {
  let config = await checkAndInitConfig();
  if (!(config && config.project_id)) {
    config.project_id = await getProjectId(config);
  }
  let params = process.argv.splice(2);
  if (!params.length) {
    exit('请选择您要进行的操作!');
  }
  if (params[0] === 'merge') {
    const merge_params = await getMergeParams();
    console.log(merge_params);
  }

}
launch();
// Get gitlab params through standard input
function getInitParams() {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log('It seems you haven\'t set gitlab token yet.');
    console.log('You need to initialize it first:');
    let token = '';
    let api = '';
    let project_name = '';
    rl.setPrompt('Project name: ');
    rl.prompt();
    rl.on('line', function (line) {
      if (line) {
        if (!project_name) {
          project_name = line;
          rl.setPrompt('Your personal access token: ');
          rl.prompt();
        } else if (!token) {
          token = line;
          rl.setPrompt('Gitlab server address: ');
          rl.prompt();
        } else {
          api = line;
          rl.close();
        }
      } else {
        rl.prompt();
      }
    }).on('close', () => {
      resolve({token, api, project_name});
    });
  });
}

// Get project id by name, token, api
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

// Write token to config file
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

async function generateConfigFile(file) {
  return new Promise(async (resolve, reject) => {
    let {token, api, project_name} = await getInitParams();
    console.log(api, token, project_name);
    console.log('Obtaining project id...');
    let project_id = await getProjectId({api, token, project_name});
    const data = `module.exports={
      project_name: \'${project_name}\',
      project_id: ${project_id},
      token: \'${token}\',
      api: \'${api}\'
    }`;
    console.log('Generating config file...');
    const res = await writeConfigToFile(file, data);
    if (res) {
      resolve({status: 0, config: {token, api, project_id, project_name}});
    }
    resolve({status: -1});
  });
}

// Check if config file exist, create one for user if not
async function checkConfigFile(file) {
  return new Promise(async (resolve, reject) => {
    var config = '';
    fs.access(file, async (err) => {
      if (err) {
        let result = await generateConfigFile(file);
        if (result.status === 0) {
          config = result.config;
        }
      } else {
        config = require(file);
      }
      resolve(config);
    });
  });
}

var gitlab = function ({api = '', token = '', project_id = ''}) {
  // private
  var api = api || '';
  var private_token = token || '';
  var project_id = project_id || '';

  // check auth params
  function checkInitParams() {
    return api && private_token && project_id;
  }

  // public
  // Get MR list
  this.getMergeRequests = function (params, query) {
    if (!checkInitParams()) {
      return false;
    }
    var request_url = `${api}`;
    if (params) {
      request_url += params.project_id ? `/projects/${params.project_id}` : '';
      request_url += params.group_id ? `/groups/${params.group_id}` : '';
    }
    request_url += `/merge_requests?private_token=${private_token}`;
    if (query && (typeof query === 'object')) {
      for (var i in query) {
        request_url += `&${i}=${query[i]}`;
      }
    }
    https.get(request_url, (res) => {
      var result = [];
      var size = 0;
      res.on('data', (chunk) => {
        result.push(chunk);
        size += chunk.length;
      })
      res.on('end', () => {
        var buff = Buffer.concat(result, size);
        console.log(buff.toString());
      });
    }).on('error', (e) => {
      console.error(e);
    });
  }

  // Create MR
  this.createMergeRequest = function (params) {
    if (!checkInitParams()) {
      return false;
    }
    if (!(params && params.project_id && params.source_branch && params.target_branch && params.title)) {
      console.log('Missing required parameters, please check your input.');
      return false;
    }
    let message = JSON.stringify({
      id: params.project_id,
      source_branch: params.source_branch,
      target_branch: params.target_branch,
      title: params.title,
      private_token: private_token
    });
    let request_url = url.parse(api);
    let options = {
      hostname: request_url.hostname,
      port: params.port || 443,
      path: `${request_url.path}/projects/${params.project_id}/merge_requests`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(message)
      }
    };

    const req = https.request(options, (res) => {
      var result = [];
      var size = 0;
      res.on('data', (chunk) => {
        result += chunk;
      })
      res.on('end', () => {
        if (result) {
          result = JSON.parse(result);
          if (result.message) {
            console.log(result.message);
          } else {
            console.log(`Request to merge ${result.source_branch} into ${result.target_branch} has been created!`);
            console.log(`Web url: ${result.web_url}`);
          }
        }
        process.exit(0);
      });
      res.on('error', (e) => {
        console.log(e);
        process.exit(0);
      });
    });
    req.on('error', (e) => {
      console.log(e);
      process.exit(0);
    });
    req.write(message);
    req.end();
  }
  this.createRepositoryBranch = async function (params) {
    if (!(params.branch && params.ref && checkInitParams())) {
      console.log('Missing required parameters, please check your input.');
      return false;
    }
    let message = JSON.stringify(Object.assign({}, params, {
      id: project_id,
      private_token: private_token
    }));
    console.log(message);
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
    await Service.post(message, options);
    child_process.execSync('git fetch');
    child_process.execSync(`git checkout ${params.branch}`);
  }
}

async function execute() {
  const config = await checkConfigFile(file);
  if (config) {
    var gl = new gitlab(config);
    var params = process.argv.splice(2);
    if (!(params && params.length)) {
      console.log('Missing required parameters!');
      console.log(require('./help.js'));
      process.exit(0);
    }
    if (params[0] === 'merge_request' || params[0] === 'mr') {
      gl.createMergeRequest({
        project_id: config.project_id,
        source_branch: params[1],
        target_branch: params[2],
        title: params[3]
      });
    } else if (params[0] === 'create_branch' || params[0] === 'cb') {
      gl.createRepositoryBranch({
        branch: params[1],
        ref: params[2]
      });
    }
  }
}

// execute();

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
            console.log(result);
            resolve(result);
          }
        });
        res.on('error', (e) => {
          console.log(e);
        });
      });
      req.on('error', (e) => {
        console.log(e);
      });
      req.write(message);
      req.end();
    });
  }
};
