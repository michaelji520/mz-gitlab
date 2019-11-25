const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');

/**
 * @description Add file to git ignore file
 * @param {string} file file name
 */
async function addFile2GitIgnore(file) {
  const cwd = process.cwd();
  const ignore = path.resolve(cwd, '.gitignore');
  if (fs.existsSync(ignore)) {
    try {
      await fs.appendFile(ignore, file);
      return true;
    } catch(err) {
      console.log(chalk.red(err));
      return false;
    }
  } else {
    console.log(chalk.red('.gitignore not found in current directory, check your path!'));
    return false;
  }
}

/**
 * @description Send Dingding message
 * @param {string} address webhook address
 * @param {object} data message
 */
async function sendWebhookMessage(address, data) {
  try {
    const result = await axios.post(address, data);
    if (result.data.errcode === 0) {
      console.log('Message successfully sent!');
      return true;
    } else {
      console.log(res);
      return false;
    }
  } catch(err) {
    console.log(res);
    return false;
  }
}

module.exports = { addFile2GitIgnore, sendWebhookMessage };
