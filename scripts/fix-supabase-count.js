#!/usr/bin/env node
// Script to find and fix incorrect Supabase count queries

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to execute shell commands
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Find files with incorrect count syntax
async function findIncorrectCountQueries() {
  console.log('🔍 Searching for incorrect Supabase count queries...');
  
  try {
    // Find all TypeScript/JavaScript files that contain .select('count(*)') or similar patterns
    const result = await execPromise(`grep -r ".select(['\\\"]count" --include="*.ts" --include="*.js" --exclude-dir="node_modules" .`);
    
    const lines = result.split('\n').filter(Boolean);
    console.log(`Found ${lines.length} potential incorrect count queries.`);
    
    return lines.map(line => {
      // Extract file path and line content
      const match = line.match(/^(.+?):([\d]+):(.+)$/);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          content: match[3].trim()
        };
      }
      return null;
    }).filter(Boolean);
  } catch (error) {
    if (error.code === 1) {
      // grep returns exit code 1 when no matches are found
      console.log('No incorrect count queries found.');
      return [];
    }
    console.error('Error searching for count queries:', error);
    return [];
  }
}

// Check and fix files
async function fixFiles(files) {
  console.log('\n=== Fixing Incorrect Supabase Count Queries ===');
  
  if (files.length === 0) {
    console.log('No files to fix.');
    return;
  }
  
  let fixedCount = 0;
  
  for (const fileInfo of files) {
    try {
      console.log(`\nExamining: ${fileInfo.file}`);
      
      // Read file content
      const content = fs.readFileSync(fileInfo.file, 'utf8');
      const lines = content.split('\n');
      
      // Find the full query (might span multiple lines)
      let startLine = fileInfo.line - 1;
      let endLine = startLine;
      let inQuery = true;
      let fixedContent = '';
      
      // Find the end of the query (when we see a semicolon or closing parenthesis followed by a semicolon)
      while (endLine < lines.length && inQuery) {
        if (/;\s*$/.test(lines[endLine]) || /\)\s*;\s*$/.test(lines[endLine])) {
          inQuery = false;
        }
        endLine++;
      }
      
      // Extract the full query
      const queryLines = lines.slice(startLine, endLine);
      const query = queryLines.join('\n');
      
      // Check if this is a Supabase count query
      if (query.includes(".select('count") || query.includes('.select("count')) {
        console.log('Found incorrect count query:');
        console.log(query);
        
        // Fix the query
        let fixed = query;
        
        if (query.match(/\.select\(['"]count\(\*\)['"]/)) {
          // Replace .select('count(*)') with .select('*', { count: 'exact', head: true })
          fixed = query.replace(
            /\.select\(['"]count\(\*\)['"]\)/,
            ".select('*', { count: 'exact', head: true })"
          );
          
          // Also fix the destructuring if possible
          if (fixed.includes('data:')) {
            fixed = fixed.replace(
              /const\s+\{\s*data(\s*:\s*[a-zA-Z0-9_]+)?\s*,\s*error(\s*:\s*[a-zA-Z0-9_]+)?\s*\}/,
              'const { count$1, error$2 }'
            );
          }
        }
        
        if (query !== fixed) {
          console.log('\nFixed query:');
          console.log(fixed);
          
          // Replace in the original file
          const newContent = [
            ...lines.slice(0, startLine),
            ...fixed.split('\n'),
            ...lines.slice(endLine)
          ].join('\n');
          
          // Create backup
          const backupFile = `${fileInfo.file}.backup`;
          fs.writeFileSync(backupFile, content);
          console.log(`Created backup: ${backupFile}`);
          
          // Write fixed content
          fs.writeFileSync(fileInfo.file, newContent);
          console.log(`✅ Fixed file: ${fileInfo.file}`);
          
          fixedCount++;
        } else {
          console.log('⚠️ Could not automatically fix this query pattern.');
        }
      }
    } catch (error) {
      console.error(`Error fixing file ${fileInfo.file}:`, error);
    }
  }
  
  return fixedCount;
}

// Main function
async function main() {
  try {
    console.log('=== Supabase Count Query Fixer ===');
    console.log('This script fixes incorrect Supabase count queries.');
    
    const incorrectQueries = await findIncorrectCountQueries();
    const fixCount = await fixFiles(incorrectQueries);
    
    console.log('\n=== Summary ===');
    console.log(`Fixed ${fixCount} out of ${incorrectQueries.length} incorrect queries.`);
    
    if (fixCount > 0) {
      console.log('\nRestart your Next.js server to apply the changes.');
    }
    
    if (incorrectQueries.length > fixCount) {
      console.log('\n⚠️ Some queries could not be automatically fixed.');
      console.log('Please check and fix them manually:');
      
      for (const query of incorrectQueries) {
        console.log(`- ${query.file} (line ${query.line})`);
      }
    }
  } catch (error) {
    console.error('Error running script:', error);
  }
}

main(); 