// Console override for production builds
// This file removes console logs in production to improve performance and security

import { environment } from './environments/environment';

if (environment.production) {
  // Override console methods in production
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for critical issues
  // console.error = () => {};
}
