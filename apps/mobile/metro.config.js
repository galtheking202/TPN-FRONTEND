const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

// Resolve modules from both the mobile app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Exclude npm temp directories from file watching
config.resolver.blockList = [
  /node_modules\/\.[\w-]+\//,
];

// Force singleton packages to always resolve from the mobile app,
// preventing dual-instance issues when shared packages import them.
const singletons = ['react', 'react-native', 'react-native-safe-area-context'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (singletons.includes(moduleName)) {
    return {
      filePath: require.resolve(moduleName, {
        paths: [path.resolve(projectRoot, 'node_modules')],
      }),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
