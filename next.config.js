// This file is a CommonJS wrapper for the ES module next.config.mjs
// It allows Next.js to find the configuration while maintaining ES module compatibility

import config from './next.config.mjs';

// Re-export the config in CommonJS format
module.exports = config; 