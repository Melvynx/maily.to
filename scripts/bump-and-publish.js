#!/usr/bin/env node

/**
 * Script to automate patch version bumping and package publishing
 * Usage: pnpm run bump-publish
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Function to execute a command and display its output
function runCommand(command, options = {}) {
  console.log(
    `${colors.blue}Executing: ${colors.yellow}${command}${colors.reset}`
  );
  try {
    return execSync(command, {
      stdio: 'inherit',
      ...options,
    });
  } catch (error) {
    console.error(
      `${colors.red}Error executing command: ${command}${colors.reset}`
    );
    throw error;
  }
}

// Function to increment the patch version of a package
function bumpPatchVersion(packageJsonPath) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}`;

  packageJson.version = newVersion;
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  console.log(
    `${colors.green}Version updated: ${colors.yellow}${currentVersion} -> ${newVersion}${colors.reset}`
  );

  return newVersion;
}

// Main function
async function main() {
  try {
    console.log(
      `${colors.green}=== Starting version bump and publish process ===${colors.reset}`
    );

    // Find all packages to publish
    const packagesDir = path.join(__dirname, '..', 'packages');
    const packages = fs.readdirSync(packagesDir).filter((dir) => {
      const packageJsonPath = path.join(packagesDir, dir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) return false;

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return !packageJson.private; // Only consider non-private packages
    });

    console.log(
      `${colors.blue}Packages to publish: ${colors.yellow}${packages.join(', ')}${colors.reset}`
    );

    // Bump version for each package
    for (const pkg of packages) {
      const packageJsonPath = path.join(packagesDir, pkg, 'package.json');
      console.log(
        `${colors.blue}Updating version for: ${colors.yellow}${pkg}${colors.reset}`
      );
      bumpPatchVersion(packageJsonPath);
    }

    // Build packages
    console.log(`${colors.blue}Building packages...${colors.reset}`);
    runCommand('pnpm run build');

    // Publish packages
    console.log(`${colors.blue}Publishing packages...${colors.reset}`);
    runCommand('pnpm publish -r --access public --no-git-checks');

    console.log(
      `${colors.green}=== Process completed successfully ===${colors.reset}`
    );
  } catch (error) {
    console.error(
      `${colors.red}An error occurred: ${error.message}${colors.reset}`
    );
    process.exit(1);
  }
}

main();
