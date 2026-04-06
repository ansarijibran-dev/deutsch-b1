/**
 * Expo config plugin that patches the generated Podfile post_install block to:
 * 1. Force SWIFT_VERSION=5.9 and disable strict concurrency on all pod targets
 *    (fixes Swift 6 errors in expo-modules-core with Xcode 16)
 * 2. Make RNScreens depend on ReactCodegen (fixes missing RNSStackScreenComponentView.h)
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const INJECTION = `
  # withRNScreensBuildFix start
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # Force Swift 5.9 language mode (supports @MainActor, no Swift 6 strict concurrency)
      swift_ver = config.build_settings['SWIFT_VERSION']
      if swift_ver.nil? || swift_ver.to_f >= 5.9
        config.build_settings['SWIFT_VERSION'] = '5.9'
      end
      config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
      # Also pass the flag directly to the Swift compiler
      flags = config.build_settings['OTHER_SWIFT_FLAGS'] || '$(inherited)'
      unless flags.include?('-strict-concurrency')
        config.build_settings['OTHER_SWIFT_FLAGS'] = flags + ' -strict-concurrency=minimal'
      end
    end
  end

  # Ensure RNScreens builds after ReactCodegen so codegen headers exist
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

      podfile = podfile.replace(
        /^(post_install do \|installer\|)/m,
        `$1\n${INJECTION}`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
