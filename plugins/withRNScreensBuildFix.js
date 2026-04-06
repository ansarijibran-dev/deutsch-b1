/**
 * Expo config plugin that patches the generated Podfile post_install block to:
 * 1. Set SWIFT_STRICT_CONCURRENCY=minimal on all pod targets (fixes Swift 6 errors in expo-modules-core)
 * 2. Make RNScreens depend on ReactCodegen (fixes missing RNSStackScreenComponentView.h)
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const INJECTION = `
  # withRNScreensBuildFix start
  # 1. Suppress Swift 6 strict concurrency errors across all pod targets
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
    end
  end

  # 2. Ensure RNScreens builds after ReactCodegen so generated headers exist
  installer.pods_project.targets.each do |target|
    next unless target.name == 'RNScreens'
    codegen_target = installer.pods_project.targets.find { |t| t.name == 'ReactCodegen' }
    next unless codegen_target
    dep = installer.pods_project.new(Xcodeproj::Project::Object::PBXTargetDependency)
    dep.target = codegen_target
    target.dependencies << dep
  end
  # withRNScreensBuildFix end
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
        `$1\n${INJECTION}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
