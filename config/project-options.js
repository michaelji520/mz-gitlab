module.exports = [
  {
    type: 'input',
    name: 'project_name',
    message: '请输入项目名称:',
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
    message: '请输入用户私钥:',
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
    message: '请输入Gitlab Api地址:',
    default: 'https://git.afpai.com/api/v4',
  },
  {
    type: 'input',
    name: 'webhook',
    message: '请输入钉钉消息通知Webhook地址:',
    default: '',
  }
];