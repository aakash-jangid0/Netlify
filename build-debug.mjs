#!/usr/bin/env node

// This script runs before the build to capture more debugging information
console.log('=============== BUILD DEBUG INFORMATION ===============');
console.log('Date:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('NPM version:', process.env.npm_version);
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- CI:', process.env.CI);
console.log('- NODE_OPTIONS:', process.env.NODE_OPTIONS);

// List all installed dependencies
console.log('\n=============== CHECKING PACKAGE.JSON ===============');
try {
  const fs = await import('fs');
  const path = await import('path');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('Package name:', packageJson.name);
    console.log('Package version:', packageJson.version);
    console.log('Node engine requirement:', packageJson.engines?.node);
    
    // Count dependencies
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    console.log(`Dependencies: ${depCount}, DevDependencies: ${devDepCount}`);
    
    // Check for critical dependencies
    const criticalDeps = ['next', 'react', 'react-dom', 'path-to-regexp'];
    for (const dep of criticalDeps) {
      console.log(`${dep}: ${packageJson.dependencies[dep] || 'NOT FOUND'}`);
    }
  } else {
    console.log('package.json not found');
  }
} catch (error) {
  console.error('Error reading package.json:', error);
}

console.log('\n=============== CHECKING FILE STRUCTURE ===============');
try {
  const fs = await import('fs');
  const path = await import('path');
  
  // Check if critical files exist
  const criticalFiles = [
    'next.config.js',
    'package.json',
    'netlify.toml',
    'app/page.tsx',
    'app/layout.tsx'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    console.log(`${file}: ${fs.existsSync(filePath) ? 'EXISTS' : 'MISSING'}`);
  }
  
  // Check directory structure
  const criticalDirs = ['app', 'node_modules', 'public'];
  for (const dir of criticalDirs) {
    const dirPath = path.join(process.cwd(), dir);
    const exists = fs.existsSync(dirPath);
    console.log(`${dir}/: ${exists ? 'EXISTS' : 'MISSING'}`);
    if (exists && dir === 'node_modules') {
      const nextInstalled = fs.existsSync(path.join(dirPath, 'next'));
      const reactInstalled = fs.existsSync(path.join(dirPath, 'react'));
      console.log(`- node_modules/next: ${nextInstalled ? 'EXISTS' : 'MISSING'}`);
      console.log(`- node_modules/react: ${reactInstalled ? 'EXISTS' : 'MISSING'}`);
    }
  }
} catch (error) {
  console.error('Error checking file structure:', error);
}

console.log('\n=============== BUILD DEBUG COMPLETE ===============');
