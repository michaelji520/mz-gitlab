module.exports = {
  operations: [
    {
      type: 'list',
      name: 'operation',
      message: '请选择您要进行的操作:',
      choices: [
        {
          name: 'launch merge request',
          value: 'merge'
        },
        {
          name: 'create new branch',
          value: 'branch'
        }
      ]
    }
  ],
  merge: [
    {
      type: 'input',
      name: 'source_branch',
      message: '请输入源分支:',
      validate: function (val) {
        return !!(val.trim());
      },
      filter: function (val) {
        return val.trim();
      }
    },
    {
      type: 'input',
      name: 'target_branch',
      message: '请输入目标分支:',
      validate: function (val) {
        return !!(val.trim());
      },
      filter: function (val) {
        return val.trim();
      }
    },
    {
      type: 'input',
      name: 'title',
      message: '请输入标题:',
      validate: function (val) {
        return !!(val.trim());
      },
      filter: function (val) {
        return val.trim();
      },
      default: (answer) => `merge ${ answer.source_branch } into ${ answer.target_branch }`
    }
  ],
  branch: [
    {
      type: 'input',
      name: 'ref',
      message: '请输入源分支:',
      validate: function (val) {
        return !!(val.trim());
      },
      filter: function (val) {
        return val.trim();
      }
    },
    {
      type: 'input',
      name: 'branch',
      message: '请输入新分支名:',
      validate: function (val) {
        return !!(val.trim());
      },
      filter: function (val) {
        return val.trim();
      }
    }
  ]
};
