// Import CommonJS module in ESM context
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('./next.config.cjs');

export default config; 