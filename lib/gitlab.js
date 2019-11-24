const EventEmitter = require('events');
const axios = require('axios');
const ora = require('ora');

module.exports = class Gitlab extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;
  }

  /**
   * @description create merge request
   * @param {string} source_branch
   * @param {string} target_branch
   * @param {string} title
   */
  async createMergeRequest({source_branch, target_branch, title}) {
    let pkg = {
      id: this.context.project_id,
      source_branch: source_branch,
      target_branch: target_branch,
      title: title,
      private_token: this.context.token
    };
    try {
      const result = await axios.post(`${this.context.api}/projects/${this.context.project_id}/merge_requests`, pkg);
      console.log(result.data.web_url);
      return result.data;
    } catch(err) {
      console.log(err && err.response && err.response.data || 'Something went wrong!')
      return false;
    }
  }

  /**
   * @description create new branch
   * @param {object} params {reference branch, new branch}
   */
  async createRepositoryBranch(params) {
    const { ref, branch } = params;
    let pkg = {
      id: this.context.project_id,
      branch: branch,
      ref: ref,
      private_token: this.context.token
    };
    const spinner = ora('Creating new branch...');
    spinner.start();
    try {
      const result = await axios.post(`${this.context.api}/projects/${this.context.project_id}/repository/branches`, pkg);
      spinner.succeed(`New branch: ${branch} created!`);
      return result.data;
    } catch(err) {
      console.log(err && err.response && err.response.data || 'Something went wrong!');
      spinner.stop();
      return false;
    }
  }
}