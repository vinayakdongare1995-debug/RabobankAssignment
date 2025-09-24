// jest.setup.js
/* Global test setup for Jest */

// 1) Polyfill TextDecoder in Node/Jest environment if missing
if (typeof global.TextDecoder === 'undefined') {
  try {
    const { TextDecoder } = require('util');
    global.TextDecoder = TextDecoder;
  } catch (err) {
    // Fallback: if you install text-encoding, uncomment below
    // const { TextDecoder } = require('text-encoding');
    // global.TextDecoder = TextDecoder;
    throw err;
  }
}

// 2) Make React available globally (some components reference React at runtime)
if (typeof global.React === 'undefined') {
  // require React and set to global so components referencing `React` don't throw
  global.React = require('react');
}

// 3) Install jest-dom matchers so `toBeInTheDocument`, `toHaveTextContent`, etc. work
// This must run after React is available.
try {
  require('@testing-library/jest-dom/extend-expect');
} catch (err) {
  // If @testing-library/jest-dom is not installed, tests will still run but some matchers will be missing.
  // You can install it with: npm install --save-dev @testing-library/jest-dom
  // We'll rethrow so you notice the missing package during CI/local runs.
  throw err;
}
