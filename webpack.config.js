//webpack

const path = require('path');
const webpack = require('webpack'); // webpack 插件
const dotenv = require('dotenv').config();
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 抽离 css 文件，使用这个插件需要单独配置 JS 和 CSS 压缩
const UglifyJsPlugin = require('uglifyjs-webpack-plugin'); // 压缩 JS
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // 压缩 CSS
const FileManagerPlugin = require('filemanager-webpack-plugin'); // webpack copy move delete mkdir archive

console.log(path.resolve(__dirname, '~/'));
console.log('NODE_ENV:', process.env.NODE_ENV);
const ASSET_PATH = process.env.ASSET_PATH || '/';


const config = {
  optimization: { // 优化项
    minimizer: [ // 压缩优化
      new UglifyJsPlugin({
        cache: true, // 缓存
        parallel: true, // 并发打包
        sourceMap: true // set to true if you want JS source maps
      }),
      new OptimizeCSSAssetsPlugin()
    ]
  },

  // 两种模式， production (生产模式) development（开发模式）
  mode: process.env.NODE_ENV,

  devtool: 'source-map',

  entry: {
    index: ['./app/scripts/shim.js', './app/styles/main.scss', './app/scripts/main.jsx']
  },

  output: {
    filename: '[name].js', // 打包后的文件名
    path: path.resolve(__dirname, './dist'), // 路径必须是绝对路径
    publicPath: ASSET_PATH
  },

  resolve: {
    modules: [path.resolve('node_modules')],
    alias: {
      '~': path.resolve(__dirname, './app/scripts/')
    },
    extensions: ['.js', '.jsx', '.scss', '.css'] // 配置省略后缀名
  },

  module: { // 模块

    rules: [ // 规则
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(scss|sass)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'sass-loader',
            options: {
              includePaths: ['./node_modules/normalize-scss/sass']
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/, // 排除
        use: {
          loader: 'babel-loader',
          options: { // 用 babel-loader 转化 ES6-ES5
            presets: [ // 这里是大插件集合
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-flow'
            ],
            plugins: [ // 这里可以配置一些小的插件
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-transform-runtime',
              '@babel/plugin-transform-regenerator'
            ]
          }
        }
      },
      {
        test: /\.(jpg|png|gif|jpeg|bmp|eot|svg|ttf|woff|woff2)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 50 * 1024,
            outputPath: './',
          }
        }
      }
    ]
  },

  // watch: true,
  // watchOptions: {
  //     poll: 2000, // 每秒问我多少次
  //     aggregateTimeout: 2000, // 防抖
  //     ignored: /node_modules|vendor|build|public|resources/
  // },
};

const htmlWebpackPluginConfig = {
  template: './app/index.html',
  filename: 'index.html',
  hash: true,
  chunks: ['index']
}

const plugins = [ // 数组，放着所有 webpack 插件
  new webpack.DefinePlugin({
    'process.env.ASSET_PATH': JSON.stringify(ASSET_PATH),
  }),
  new MiniCssExtractPlugin({
    filename: '[name].min.css'
  }),
  new FileManagerPlugin({
    onEnd: {
      copy: [{
        source: path.resolve(__dirname, 'favicon.ico'),
        destination: path.resolve(__dirname, 'dist/')
      }]
    }
  })
]

const devServer = {
  port: 8006,
  progress: true, // 进度条
  contentBase: './dist', // 配置目录
  open: true, // 在DevServer第一次构建完成时，自动用浏览器打开网页
  historyApiFallback: true,
  hot: true,
  proxy: {
    '/api': {
      target: process.env.API_SERVER_URL,
      //changeOrigin 的意思就是把 http 请求中的 Origin 字段进行变换，在浏览器接收到后端回复的时候，浏览器会以为这是本地请求，而在后端那边会以为是在站内的调用。
      changeOrigin: true,
    }
  },
  before(app) {
    app.get('/api/test', (req, res) => {
      res.json({
        'status': 'successful!'
      })
    })
  }
}

if (process.env.NODE_ENV === 'production') {
  // 优化 html 文件
  htmlWebpackPluginConfig.minify = {
    removeComments: true,
    removeAttributeQuotes: true,
    collapseWhitespace: true
  }
  // 源码映射，生成一个映射文件，帮我们定位源码文件
  config.devtool = 'none';
} else {
  config.devServer = devServer;
}

plugins.push(new HtmlWebpackPlugin(htmlWebpackPluginConfig));

config.plugins = plugins;
module.exports = config;
