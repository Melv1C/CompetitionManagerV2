import "varlock/auto-load";

console.info("Competition Manager worker started");

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
