# <%- project_name %>
This is a base project that be generated by [generator-cychen](https://github.com/cychen7/generator-cychen.git).

## 目录结构
  |–node_modules        nodejs组件目录
  |-bower_components		bower组件目录
  |–src                 生产环境(开发环境)
      |–css             样式文件（css/scss/less）
      |-css/_modules    公用样式模块
      |-icons           (雪碧图)图标集
      |-global          框架库、全局样式、js等
      |–images          图片文件
      |-fonts           自定义的图标字体
      |–js              js文件
      |–view            静态html
      |-dev             项目依赖文件(测试json文件等)

  |–dist                发布环境
      |–css             样式文件(压缩的样式文件)
      |–images          图片文件(压缩图片)
      |–js              js文件(压缩的js文件)
      |-global          框架库（压缩合并后只有global.js、global.css、global.png）
      |-fonts           图标字体
      |–view            静态文件(压缩html)

  |–.jshintrc           jshint配置文件
  |-babelrc             ES5
  |-gulpfile.babel.js   gulp配置文件
  |-package.json        包管理

## License
<%- project_license %> © <%- project_author %>
