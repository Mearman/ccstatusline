#!/usr/bin/env bun

import {
    readFileSync,
    writeFileSync
} from 'fs';
import { join } from 'path';
import { z } from 'zod';

const PackageJsonSchema = z.object({ version: z.string() }).loose();

// Read package.json to get version
const packageJson = PackageJsonSchema.parse(JSON.parse(readFileSync('package.json', 'utf-8')));
const version = packageJson.version;

// Read the bundled file
const bundledFilePath = join('dist', 'ccstatusline.js');
let bundledContent = readFileSync(bundledFilePath, 'utf-8');

// Replace the placeholder with the actual version
bundledContent = bundledContent.replace(/__PACKAGE_VERSION__/g, version);

// Write back the modified content
writeFileSync(bundledFilePath, bundledContent);

console.log(`✓ Replaced version placeholder with ${version}`);