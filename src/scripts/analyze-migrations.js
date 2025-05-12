// Script to analyze migration files for duplicates or conflicts
const fs = require('fs');
const path = require('path');

// Function to check for duplicate or conflicting SQL commands
async function analyzeMigrations() {
  console.log('🔍 Analyzing migration files for duplicates or conflicts...');
  
  // Find migration directories
  const migrationDirs = [
    path.join(process.cwd(), 'supabase', 'migrations'),
    path.join(process.cwd(), 'database', 'migrations'),
  ];
  
  let migrationFiles = [];
  
  // Collect all migration files
  migrationDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(file => file.endsWith('.sql'))
        .map(file => ({ 
          path: path.join(dir, file),
          name: file,
          timestamp: file.split('_')[0]
        }));
      
      migrationFiles = [...migrationFiles, ...files];
    }
  });
  
  console.log(`Found ${migrationFiles.length} migration files`);
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found to analyze.');
    return;
  }
  
  // Sort migration files by timestamp
  migrationFiles.sort((a, b) => {
    // Handle both numeric and date-based timestamps
    const aIsDate = /^\d{8}|\d{14}|\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(a.timestamp);
    const bIsDate = /^\d{8}|\d{14}|\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(b.timestamp);
    
    if (aIsDate && bIsDate) {
      return a.timestamp.localeCompare(b.timestamp);
    } else {
      // Handle mixed formats or non-standard formats
      return a.name.localeCompare(b.name);
    }
  });
  
  // Store SQL operations by type for comparison
  const operations = {
    createTable: {},
    alterTable: {},
    dropTable: {},
    createIndex: {},
    createPolicy: {},
    dropPolicy: {},
    insertData: {}
  };
  
  const potentialConflicts = [];
  const duplicateOperations = [];
  
  // Process each migration file
  for (const file of migrationFiles) {
    console.log(`\nAnalyzing: ${file.name}`);
    
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // Extract SQL operations
      // Create table operations
      const createTableOps = extractCreateTableOperations(content, file.name);
      checkForDuplicatesAndConflicts(createTableOps, operations.createTable, duplicateOperations, potentialConflicts, 'createTable');
      
      // Alter table operations
      const alterTableOps = extractAlterTableOperations(content, file.name);
      checkForDuplicatesAndConflicts(alterTableOps, operations.alterTable, duplicateOperations, potentialConflicts, 'alterTable');
      
      // Drop table operations
      const dropTableOps = extractDropTableOperations(content, file.name);
      checkForDuplicatesAndConflicts(dropTableOps, operations.dropTable, duplicateOperations, potentialConflicts, 'dropTable');
      
      // Create index operations
      const createIndexOps = extractCreateIndexOperations(content, file.name);
      checkForDuplicatesAndConflicts(createIndexOps, operations.createIndex, duplicateOperations, potentialConflicts, 'createIndex');
      
      // Create policy operations
      const createPolicyOps = extractCreatePolicyOperations(content, file.name);
      checkForDuplicatesAndConflicts(createPolicyOps, operations.createPolicy, duplicateOperations, potentialConflicts, 'createPolicy');
      
      // Drop policy operations
      const dropPolicyOps = extractDropPolicyOperations(content, file.name);
      checkForDuplicatesAndConflicts(dropPolicyOps, operations.dropPolicy, duplicateOperations, potentialConflicts, 'dropPolicy');
      
      // Insert data operations
      const insertDataOps = extractInsertDataOperations(content, file.name);
      checkForDuplicatesAndConflicts(insertDataOps, operations.insertData, duplicateOperations, potentialConflicts, 'insertData');
    } catch (err) {
      console.error(`Error reading file ${file.path}:`, err);
    }
  }
  
  // Report findings
  console.log('\n--- Analysis Results ---');
  
  if (duplicateOperations.length > 0) {
    console.log(`\n⚠️ Found ${duplicateOperations.length} duplicate operations:`);
    duplicateOperations.forEach(dup => {
      console.log(`  - ${dup.type} operation in ${dup.file} duplicates one in ${dup.existingFile}`);
      console.log(`    Operation: ${dup.operation}`);
    });
  } else {
    console.log('\n✅ No exact duplicate operations found');
  }
  
  if (potentialConflicts.length > 0) {
    console.log(`\n⚠️ Found ${potentialConflicts.length} potential conflicts:`);
    potentialConflicts.forEach(conflict => {
      console.log(`  - ${conflict.type} operation in ${conflict.file} may conflict with ${conflict.conflictFile}`);
      console.log(`    Operation: ${conflict.operation}`);
      console.log(`    Conflict: ${conflict.conflictOperation}`);
    });
  } else {
    console.log('\n✅ No potential conflicts detected');
  }
  
  // Analyze migration file timestamps for ordering issues
  const timestampIssues = checkTimestampOrdering(migrationFiles);
  if (timestampIssues.length > 0) {
    console.log(`\n⚠️ Found ${timestampIssues.length} timestamp ordering issues:`);
    timestampIssues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  } else {
    console.log('\n✅ All migration files appear to be correctly ordered by timestamp');
  }
  
  // Create final recommendations
  console.log('\n--- Recommendations ---');
  
  if (duplicateOperations.length > 0 || potentialConflicts.length > 0 || timestampIssues.length > 0) {
    console.log('1. Consider consolidating duplicate migrations');
    console.log('2. Review potential conflicts to ensure they don\'t cause issues');
    console.log('3. Fix any timestamp ordering issues to ensure migrations run in the correct order');
    
    // List specific files to consider removing
    if (duplicateOperations.length > 0) {
      const duplicateFiles = [...new Set(duplicateOperations.map(d => d.file))];
      console.log('\nConsider reviewing these files for redundant operations:');
      duplicateFiles.forEach(file => console.log(`  - ${file}`));
    }
  } else {
    console.log('All migration files appear to be clean with no duplicates or conflicts.');
  }
}

// Helper functions to extract operations
function extractCreateTableOperations(content, fileName) {
  const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?([\w_]+)\s*\(/gi;
  const operations = [];
  let match;
  
  while ((match = createTableRegex.exec(content)) !== null) {
    operations.push({
      tableName: match[1].toLowerCase(),
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

function extractAlterTableOperations(content, fileName) {
  const alterTableRegex = /ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:public\.)?([\w_]+)\s+([^;]+);/gi;
  const operations = [];
  let match;
  
  while ((match = alterTableRegex.exec(content)) !== null) {
    operations.push({
      tableName: match[1].toLowerCase(),
      alterStatement: match[2].trim(),
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

function extractDropTableOperations(content, fileName) {
  const dropTableRegex = /DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:public\.)?([\w_]+)/gi;
  const operations = [];
  let match;
  
  while ((match = dropTableRegex.exec(content)) !== null) {
    operations.push({
      tableName: match[1].toLowerCase(),
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

function extractCreateIndexOperations(content, fileName) {
  const createIndexRegex = /CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF\s+NOT\s+EXISTS)?\s+([\w_]+)\s+ON\s+(?:public\.)?([\w_]+)/gi;
  const operations = [];
  let match;
  
  while ((match = createIndexRegex.exec(content)) !== null) {
    operations.push({
      indexName: match[1].toLowerCase(),
      tableName: match[2].toLowerCase(),
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

function extractCreatePolicyOperations(content, fileName) {
  const createPolicyRegex = /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?([\w_]+)/gi;
  const operations = [];
  let match;
  
  while ((match = createPolicyRegex.exec(content)) !== null) {
    operations.push({
      policyName: match[1].toLowerCase(),
      tableName: match[2].toLowerCase(),
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

function extractDropPolicyOperations(content, fileName) {
  const dropPolicyRegex = /DROP\s+POLICY(?:\s+IF\s+EXISTS)?\s+"([^"]+)"\s+ON\s+(?:public\.)?([\w_]+)/gi;
  const operations = [];
  let match;
  
  while ((match = dropPolicyRegex.exec(content)) !== null) {
    operations.push({
      policyName: match[1].toLowerCase(),
      tableName: match[2].toLowerCase(),
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

function extractInsertDataOperations(content, fileName) {
  const insertRegex = /INSERT\s+INTO\s+(?:public\.)?([\w_]+)\s*(\([^)]+\))?\s*VALUES/gi;
  const operations = [];
  let match;
  
  while ((match = insertRegex.exec(content)) !== null) {
    operations.push({
      tableName: match[1].toLowerCase(),
      columns: match[2] ? match[2] : '',
      operation: match[0],
      file: fileName
    });
  }
  
  return operations;
}

// Helper function to check for duplicates and conflicts
function checkForDuplicatesAndConflicts(operations, existingOperations, duplicates, conflicts, type) {
  operations.forEach(op => {
    const key = type === 'createTable' || type === 'dropTable' ? 
      op.tableName : 
      (type === 'createIndex' ? `${op.indexName}_${op.tableName}` : 
        (type === 'createPolicy' || type === 'dropPolicy' ? `${op.policyName}_${op.tableName}` : 
          (type === 'insertData' ? `${op.tableName}_${op.columns}` : `${op.tableName}_${op.alterStatement}`)));
    
    if (existingOperations[key]) {
      // Check for exact duplicate
      if (op.operation === existingOperations[key].operation) {
        duplicates.push({
          type,
          operation: op.operation,
          file: op.file,
          existingFile: existingOperations[key].file
        });
      } 
      // Check for potential conflicts
      else {
        conflicts.push({
          type,
          operation: op.operation,
          file: op.file,
          conflictOperation: existingOperations[key].operation,
          conflictFile: existingOperations[key].file
        });
      }
    } else {
      existingOperations[key] = op;
    }
  });
}

// Helper function to check timestamp ordering issues
function checkTimestampOrdering(migrationFiles) {
  const issues = [];
  const timestampFormat = /^\d{8}|\d{14}|\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/;
  
  // Check timestamp format consistency
  const nonStandardTimestamps = migrationFiles.filter(file => !timestampFormat.test(file.timestamp));
  if (nonStandardTimestamps.length > 0) {
    issues.push(`Found ${nonStandardTimestamps.length} files with non-standard timestamp formats`);
    nonStandardTimestamps.forEach(file => {
      issues.push(`  - ${file.name} has non-standard timestamp: ${file.timestamp}`);
    });
  }
  
  // Check for duplicate timestamps
  const timestampCounts = {};
  migrationFiles.forEach(file => {
    if (!timestampCounts[file.timestamp]) {
      timestampCounts[file.timestamp] = [];
    }
    timestampCounts[file.timestamp].push(file.name);
  });
  
  Object.entries(timestampCounts)
    .filter(([timestamp, files]) => files.length > 1)
    .forEach(([timestamp, files]) => {
      issues.push(`Duplicate timestamp ${timestamp} found in ${files.length} files: ${files.join(', ')}`);
    });
  
  return issues;
}

// Execute the analysis
analyzeMigrations().catch(err => console.error(err));
