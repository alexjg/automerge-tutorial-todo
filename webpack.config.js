const path = require('path');

module.exports = {
  experiments: { asyncWebAssembly: true, topLevelAwait: true},
  target: 'web',
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public'),
  },
  module: {
    rules: [
      {
        "test": /\.css$/i,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  mode: "development", // or production
  performance: {       // we dont want the wasm blob to generate warnings
     hints: false,
     maxEntrypointSize: 512000,
     maxAssetSize: 512000
  }
};

