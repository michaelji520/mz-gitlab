const EventEmitter = require('events');
const ora = require('ora');
const axios = require('axios');
const inquirer = require('inquirer');

module.exports = class Gitlab extends EventEmitter {
  constructor(context) {
    super();
    this.context = context;
    this.queryProjectId(context);
  }
}