const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// pnpm: permitir subir a arvore de node_modules (sem isto o export web falha)
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
