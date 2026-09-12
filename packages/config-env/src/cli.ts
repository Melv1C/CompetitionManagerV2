import { environmentTemplate, parseEnvironment } from "./index.js";

const command = process.argv[2];

if (command === "generate") {
  await Bun.write("../../.env.generated", environmentTemplate());
  console.log("Generated .env.generated");
} else if (command === "validate") {
  parseEnvironment(Bun.env);
  console.log("Environment is valid");
} else {
  console.error("Usage: bun src/cli.ts <generate|validate>");
  process.exitCode = 1;
}
