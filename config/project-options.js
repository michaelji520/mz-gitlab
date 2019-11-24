module.exports = [
  {
    type: 'input',
    name: 'project_name',
    message: 'Input name of gitlab repository:',
    validate: function (val) {
      return !!(val.trim());
    },
    filter: function (val) {
      return val.trim();
    }
  },
  {
    type: 'input',
    name: 'token',
    message: 'Input your private token of gitlab:',
    validate: function (val) {
      return !!(val.trim());
    },
    filter: function (val) {
      return val.trim();
    }
  },
  {
    type: 'input',
    name: 'api',
    message: 'Input gitlab api address:',
    default: 'https://git.afpai.com/api/v4',
  },
  {
    type: 'input',
    name: 'webhook',
    message: 'Input webhook address of Dingding:',
    default: '',
  }
];