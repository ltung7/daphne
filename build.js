import fs from 'fs';
import path from 'path';
import { logger } from './sc/logger.js';

function copyFolder(sourceDir, destinationDir) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir);
  }

  // Read the source directory
  const files = fs.readdirSync(sourceDir);

  // Iterate over each file in the source directory
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destinationDir, file);

    // Check if the current item is a file or directory
    if (fs.statSync(sourcePath).isDirectory()) {
      // Recursively copy subdirectories
      copyFolder(sourcePath, destPath);
    } else {
      // Copy the file
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

logger.log('Copying build files');
copyFolder('./data', './build/data');

logger.log('Rewriting abort error')
let indexContent = await fs.promises.readFile('./build/index.js', 'utf-8');
indexContent = indexContent.replace('!isAbortSignal(signal)', 'false');
indexContent = indexContent.replace('!isAbortSignal4(signal)', 'false');
await fs.promises.writeFile('./build/index.js', indexContent);

logger.log('Adding version number')

let content = await fs.readFileSync('./build/app.yaml', 'utf-8');
content = content.replace('expiration: 30d 0h', 'expiration: 366d 0h')
if (content.indexOf('PUBLIC_APP_VER') < 0) {
  const pkg = JSON.parse(fs.readFileSync('./package.json'));
  content = content.replace('env_variables:', 'env_variables:\r\n  PUBLIC_APP_VER: "' + pkg.version + '"');
}
fs.writeFileSync('./build/app.yaml', content);

const SKIP_ENV = [ 'NODE_ENV', 'IDOSELL_APP_KEY', 'IDOSELL_APP_ID', 'IDOSELL_APP_DEV' ]
const envFile = fs.readFileSync('.env', 'utf8');
const envBlockMatch = content.match(/^env_variables:\s*\n([\s\S]*?)(?=^entrypoint:)/m);
if (!envBlockMatch) {
  logger.error('Could not find env_variables block in app.yaml');
  process.exit(1);
}
const yamlKeys = new Set(
  [ ...envBlockMatch[1].matchAll(/^\s+([A-Z0-9_]+)\s*:/gm) ]
    .map(m => m[1])
    .concat(SKIP_ENV)
);

const dotenvKeys = new Set(
  envFile
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.split('=')[0].trim())
    .filter(Boolean)
);

// Keys in .env but missing from app.yaml
const missingInYaml = [ ...dotenvKeys ].filter(k => !yamlKeys.has(k));

if (missingInYaml.length) {
  logger.warn('Missing in app.yaml (defined in .env):');
  missingInYaml.forEach(k => logger.warn(`- ${k}`));
}