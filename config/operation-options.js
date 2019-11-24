module.exports = {
  operations: [
    {
      type: 'list',
      name: 'operation',
      message: 'Choose your operation:',
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
      message: 'Input source branch:',
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
      message: 'Input target branch:',
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
      message: 'Input title of merge request:',
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
      message: 'Input reference branch:',
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
      message: 'Input new branch name:',
      validate: function (val) {
        return !!(val.trim());
      },
      filter: function (val) {
        return val.trim();
      }
    }
  ]
};
