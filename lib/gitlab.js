const EventEmitter = require('events');
const axios = require('axios');
const ora = require('ora');

module.exports = class Gitlab extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;
  }
  async createRepositoryBranch(params) {
    const { ref, branch } = params;
    let pkg = {
      id: this.context.project_id,
      branch: branch,
      ref: ref,
      private_token: this.context.token
    };
    const spinner = ora('正在创建分支...');
    spinner.start();
    try {
      const result = await axios.post(`${this.context.api}/projects/${this.context.project_id}/repository/branches`, pkg);
      spinner.succeed(`创建分支${branch}成功!`);
      return true;
    } catch(err) {
      console.log(err.data);
      spinner.stop();
      return false;
    }
  }
}