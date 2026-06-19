const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolver problemas de resolución ESM de react-i18next redirigiéndolo a su build CommonJS
config.resolver.extraNodeModules = {
  'react-i18next': path.resolve(__dirname, 'node_modules/react-i18next/dist/commonjs/index.js'),
};

module.exports = config;
