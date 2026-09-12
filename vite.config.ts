import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    options: { typeAware: true, typeCheck: true },
    rules: {
      "no-unused-vars": "error",
      "no-console": "allow",
      "no-floating-promises": "allow",
    },
    plugins: ["eslint", "unicorn", "typescript", "oxc", "react", "react-perf"],
  },
  fmt: {
    ignorePatterns: ["docs/competition-manager-rewrite-agent-spec.md"],
    sortPackageJson: { sortScripts: true },
    sortImports: {},
    sortTailwindcss: {},
  },
});
