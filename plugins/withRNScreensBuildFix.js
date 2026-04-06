/**
 * Expo config plugin that patches the generated Podfile to ensure
 * RNScreens builds AFTER ReactCodegen by injecting a post_install hook.
 *
 * Without this, Xcode parallelises pod target compilation and RNScreens
 * tries to import codegen-generated headers (RNSStackScreenComponentView.h)
 * before ReactCodegen has produced them, causing a fatal error.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const POST_INSTALL_HOOK = `
# Fix: ensure RNScreens compiles after ReactCodegen so generated headers exist
post_install do |installer|
  installer.pods_project.targets.each do |target|
    next unless target.name == 'RNScreens'
    codegen_target = installer.pods_project.targets.find { |t| t.name == 'ReactCodegen' }
    next unless codegen_target
    dep = installer.pods_project.new(Xcodeproj::Project::Object::PBXTargetDependency)
    dep.target = codegen_target
    target.dependencies << dep
    puts "[withRNScreensBuildFix] Added ReactCodegen dependency to RNScreens"
  end
end
`;

module.exports = function withRNScreensBuildFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      if (!podfile.includes('withRNScreensBuildFix')) {
        podfile += POST_INSTALL_HOOK;
        fs.writeFileSync(podfilePath, podfile);
      }
      return config;
    },
  ]);
};
