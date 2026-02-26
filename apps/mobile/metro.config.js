const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const rushTempNodeModules = path.join(monorepoRoot, 'common/temp/node_modules');

const config = getDefaultConfig(projectRoot);

// Rush + pnpm: dependencies live in common/temp/node_modules. Metro must watch and resolve from there
// so nested deps (e.g. expo-modules-core required by expo) are found.
config.watchFolders = config.watchFolders || [];
if (!config.watchFolders.includes(rushTempNodeModules)) {
  config.watchFolders.push(rushTempNodeModules);
}

config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = config.resolver.nodeModulesPaths || [];
if (!config.resolver.nodeModulesPaths.includes(rushTempNodeModules)) {
  config.resolver.nodeModulesPaths.unshift(rushTempNodeModules);
}

module.exports = config;
