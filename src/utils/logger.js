// This file provides utility functions for logging messages, which can be used throughout the extension for debugging purposes.

const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log("[YTMusic Discord]", ...args);
  }
}

function error(...args) {
  console.error("[YTMusic Discord Error]", ...args);
}

function info(...args) {
  console.info("[YTMusic Discord Info]", ...args);
}

function warn(...args) {
  console.warn("[YTMusic Discord Warning]", ...args);
}

export { log, error, info, warn };