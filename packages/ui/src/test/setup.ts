import { afterAll, beforeAll } from "vitest";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const consoleMethods = ["error", "warn"] as const;
const originalConsoleMethods = {
  error: console.error,
  warn: console.warn,
};

beforeAll(() => {
  for (const method of consoleMethods) {
    console[method] = (...args) => {
      originalConsoleMethods[method](...args);
      throw new Error(`Unexpected console.${method} output`);
    };
  }
});

afterAll(() => {
  for (const method of consoleMethods) {
    console[method] = originalConsoleMethods[method];
  }
});
