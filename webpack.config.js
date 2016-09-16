var path    = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var imgPath = path.resolve('node_modules/ushahidi-platform-pattern-library/assets/');

module.exports = {
  devtool: 'source-map',
  entry: {},
  module: {
    loaders: [
       { test: /\.js$/, exclude: [/app\/lib/, /node_modules/], loader: 'ng-annotate!babel' },
       { test: /\.html$/, loader: 'html?attrs[]=img:src&attrs[]=use:xlink:href&attrs[]=link:href&root='+imgPath },
       { test: /\.scss$/, loader: 'style!css!resolve-url!sass?sourceMap' },
       { test: /\.css$/, loader: 'style!css' },
       { test: /\.png/, loader: 'url?limit=10000' },
       { test: /\.svg/, loader: 'svg-url?limit=10000' },
       { test: /\.woff/, loader: 'url?limit=10000' },
       { test: /\.ttf|\.eot/, loader: 'file' },
       { test: /\.json$/, loader: 'json' },
    ]
  },
  plugins: [
    // Injects bundles in your index.html instead of wiring all manually.
    // It also adds hash to all injected assets so we don't have problems
    // with cache purging during deployment.
    new HtmlWebpackPlugin({
      template: 'app/index.html',
      inject: 'body',
      hash: true
    }),

    // Automatically move all modules defined outside of application directory and pattern library
    // to vendor bundle. If you are using more complicated project structure, consider to specify
    // common chunks manually.
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module, count) {
        return module.resource
            && module.resource.indexOf(path.resolve(__dirname, 'app')) === -1
            && module.resource.indexOf('ushahidi-platform-pattern-library') === -1;
      }
    })
  ]
};