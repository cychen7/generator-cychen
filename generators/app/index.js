'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var path = require('path');
var _ = require('lodash');
var extend = require('deep-extend');
var mkdirp = require('mkdirp');


module.exports = yeoman.Base.extend({

  initializing: function() {
    this.props = {
      "projectName":path.basename(process.cwd())
    };
  },

  prompting: function() {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the unreal ' + chalk.red('generator-cychen') + ' generator!'
    ));

    var prompts = [{
      type: 'input',
      name: 'projectName',
      message: 'Please input project name (' + this.props.projectName + '):'
    }, {
      type: 'input',
      name: 'projectDesc',
      message: 'Please input project description:'
    }, {
      type: 'input',
      name: 'projectMain',
      message: 'Main file (index.js):',
      default: 'index.js'
    }, {
      type: 'input',
      name: 'projectAuthor',
      message: 'Author:'
    }, {
      type: 'list',
      name: 'projectLicense',
      message: 'Please choose license:',
      choices: ['MIT', 'ISC', 'Apache-2.0', 'AGPL-3.0']
    }];

    this.prompt(prompts, function(props) {
      this.props = props;
      // To access props later use this.props.someOption;
      done();
    }.bind(this));


  },

  defaults: function() {

    if (path.basename(this.destinationPath()) !== this.props.projectName) {
      this.log(
        'Your generator must be inside a folder named ' + this.props.projectName + '\n' +
        'I\'ll automatically create this folder.'
      );
      mkdirp(this.props.projectName);
      this.destinationRoot(this.destinationPath(this.props.projectName));
    }

  },

  writing: function() {
    // readme文件
    var readmeTmpl = _.template(this.fs.read(this.templatePath('README.md')));
    this.fs.write(this.destinationPath('README.md'), readmeTmpl({
      project_name: this.props.projectName,
      project_license: this.props.projectLicense,
      project_author: this.props.projectAuthor
    }));
    // package.json 文件
    var pkgTmpl = _.template(this.fs.read(this.templatePath('package_tmpl.json')));
    this.fs.write(this.destinationPath('package.json'), pkgTmpl({
      project_name: this.props.projectName,
      project_desc: this.props.projectDesc,
      main_file: this.props.projectMain,
      author: this.props.projectAuthor,
      license: this.props.projectLicense
    }));

    // 创建文件目录
    mkdirp('src/dev');
    mkdirp('src/fonts');
    mkdirp('src/global');
    mkdirp('src/icons');
    mkdirp('src/images');
    mkdirp('src/js');
    mkdirp('src/css');
    mkdirp('src/css/_modules');
    mkdirp('src/view');
    // 复制git忽略设置文件
    this.fs.copy(
      this.templatePath('gitignore_tmpl'),
      this.destinationPath('.gitignore')
    );
    // 复制js检查设置文件
    this.fs.copy(
      this.templatePath('jshintrc_tmpl'),
      this.destinationPath('.jshintrc')
    );
    // 复制gulpfile.js文件
    this.fs.copy(
      this.templatePath('gulpfile_tmpl.js'),
      this.destinationPath('gulpfile.babel.js')
    );
    // 复制雪碧图css模板文件
    this.fs.copy(
      this.templatePath('handlebarsStr_tmpl.css'),
      this.destinationPath('handlebarsStr.css')
    );
    this.fs.copy(
      this.templatePath('babelrc_tmpl'),
      this.destinationPath('.babelrc_tmpl')
    );
  },

  // install: function() {
  //   this.installDependencies({
  //     bower: false
  //   });
  // }
});
