#!/usr/bin/env node
// Script to verify and fix Next.js API routes

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

// Validate Next.js API routes
async function validateApiRoutes() {
  console.log('=== Validating Next.js API Routes ===');
  
  // Check if the app directory exists
  const appDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(appDir)) {
    console.error('❌ app directory not found. Are you in the right project?');
    return;
  }
  
  console.log('🔍 Searching for Next.js API route files...');
  
  // Find all route.ts or route.js files
  try {
    const routeFiles = await execPromise('find app -name "route.ts" -o -name "route.js"');
    const files = routeFiles.split('\n').filter(Boolean);
    
    console.log(`Found ${files.length} route files.`);
    
    for (const file of files) {
      console.log(`\nAnalyzing: ${file}`);
      
      // Read file content
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for export issues
      const hasNamedExports = /export (async )?function (GET|POST|PUT|PATCH|DELETE)/g.test(content);
      
      if (!hasNamedExports) {
        console.log('❌ No export functions (GET, POST, etc.) found in this route file.');
        continue;
      }
      
      // Check each HTTP method export
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
      for (const method of methods) {
        const methodRegex = new RegExp(`export (async )?function ${method}\\b`, 'g');
        if (methodRegex.test(content)) {
          console.log(`✅ ${method} method is properly exported`);
        }
      }
      
      // Check for common issues
      if (/export default/.test(content)) {
        console.log('⚠️ Warning: File uses export default which is not supported in App Router API routes');
      }
    }
  } catch (error) {
    console.error('Error scanning route files:', error);
  }
}

// Check for the specific sources route
function checkSchedulerSourcesRoute() {
  console.log('\n=== Checking Scheduler Sources API Route ===');
  
  const routePath = 'app/api/tracks/scheduler/sources/route.ts';
  
  if (!fs.existsSync(routePath)) {
    console.log(`❌ Route file not found: ${routePath}`);
    return false;
  }
  
  console.log(`Found route file: ${routePath}`);
  
  // Read the file contents
  const content = fs.readFileSync(routePath, 'utf8');
  
  // Check if POST method is exported correctly
  const hasPostExport = /export (async )?function POST\b/.test(content);
  
  if (hasPostExport) {
    console.log('✅ POST method is correctly exported');
  } else {
    console.log('❌ POST method is not properly exported');
  }
  
  return true;
}

// Fix common API route issues
function fixApiRouteIssues() {
  console.log('\n=== Attempting to Verify API Routes Configuration ===');
  
  // Check if Next.js configuration exists
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    console.log('Found next.config.js');
    
    // Read config content
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for potential issues
    if (configContent.includes('rewrites') || configContent.includes('redirects')) {
      console.log('⚠️ Your next.config.js contains rewrites or redirects that might affect API routes');
    }
  } else {
    console.log('No next.config.js found. Using default Next.js configuration.');
  }
  
  // Verify the middleware
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    console.log('Found middleware.ts - checking for API route exclusions...');
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    
    if (!middlewareContent.includes('/api/') && middlewareContent.includes('matcher')) {
      console.log('⚠️ Your middleware might be processing API routes without excluding them');
    }
  }
}

// Main function
async function main() {
  try {
    console.log('Running Next.js API Routes Validator');
    
    await validateApiRoutes();
    const routeExists = checkSchedulerSourcesRoute();
    fixApiRouteIssues();
    
    console.log('\n=== Summary ===');
    if (routeExists) {
      console.log('The scheduler sources API route exists and has been analyzed.');
      console.log('\nPossible solutions for 405 Method Not Allowed errors:');
      console.log('1. Make sure your API route is correctly exported with named functions (export async function POST)');
      console.log('2. Check your middleware.ts to ensure it\'s not blocking API routes');
      console.log('3. Verify your next.config.js doesn\'t redirect or rewrite your API routes');
      console.log('4. Ensure your browsers are not caching previous 405 responses (try Incognito/Private mode)');
    }
  } catch (error) {
    console.error('Error validating API routes:', error);
  }
}

main(); 