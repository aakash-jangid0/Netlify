// This script helps debug Netlify dependency installation issues
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);

try {
  // Try to load potentially problematic dependencies
  import('path-to-regexp').then(() => {
    console.log('path-to-regexp loaded successfully');
  }).catch(error => {
    console.error('Error loading path-to-regexp:', error.message);
  });
} catch (error) {
  console.error('Error importing path-to-regexp:', error.message);
}

try {
  // List installed packages in node_modules
  import('fs').then(fs => {
    import('path').then(path => {
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {    console.log('node_modules directory exists');
    const dirs = fs.readdirSync(nodeModulesPath);
    console.log(`Found ${dirs.length} packages in node_modules`);
  } else {
    console.log('node_modules directory does not exist');
  }
    }).catch(error => {
      console.error('Error importing path:', error.message);
    });
  }).catch(error => {
    console.error('Error importing fs:', error.message);
  });
} catch (error) {
  console.error('Error checking node_modules:', error.message);
}
