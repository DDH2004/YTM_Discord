// This file provides utility functions for logging messages, which can be used throughout the extension for debugging purposes.

const debugMode = true;

function debugLog(...args) {
  if (debugMode) {
    console.log('[YTM Discord]', ...args);
  }
}

function log(...args) {
  console.log('[YTM Discord]', ...args);
}

function error(...args) {
  console.error('[YTM Discord]', ...args);
}

function info(...args) {
  console.info('[YTM Discord]', ...args);
}

function warn(...args) {
  console.warn('[YTM Discord]', ...args);
}

module.exports = {
  debugLog,
  log,
  error,
  info,
  warn
};