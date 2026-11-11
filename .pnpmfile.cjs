// openapi-typescript builds types with the TypeScript 5 compiler API, which TypeScript 7 doesn't have.
function readPackage(pkg) {
  if (pkg.name === 'openapi-typescript') {
    delete pkg.peerDependencies.typescript;
    pkg.dependencies.typescript = '5.9.3';
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
