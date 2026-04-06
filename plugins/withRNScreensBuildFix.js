/**
 * Expo config plugin: ensures RNScreens builds after ReactCodegen.
 *
 * Injects into the EXISTING post_install block (CocoaPods only allows one).
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const INJECTION = `
  # Fix: ensure RNScreens compiles after ReactCodegen so codegen headers exist
  installer.pods_project.targets.each do |target|
    next unless target.name == 'RNScreens'
    codegen_target = installer.pods_project.targets.find { |t| t.name == 'ReactCodegen' }
    next unless codegen_target
    dep = installer.pods_project.new(Xcodeproj::Project::Object::PBXTargetDependency)
    dep.target = codegen_target
    target.dependencies << dep
  end
`;

module.exports = function withRNScreensBuildFix(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes('withRNScreensBuildFix')) {
        return config; // already patched
      }

      // Insert into the existing post_install block right after its opening line
      podfile = podfile.replace(
        /^(post_install do \|installer\|)/m,
        `$1\n  # withRNScreensBuildFix\n${INJECTION}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
