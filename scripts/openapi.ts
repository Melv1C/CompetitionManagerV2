const document = {
  openapi: "3.1.0",
  info: {
    title: "Competition Manager API",
    version: "0.0.0",
  },
  paths: {
    "/health/live": {
      get: {
        operationId: "getLiveness",
        responses: { "200": { description: "Process is alive" } },
      },
    },
    "/health/ready": {
      get: {
        operationId: "getReadiness",
        responses: {
          "200": { description: "Required infrastructure is ready" },
          "503": { description: "Required infrastructure is unavailable" },
        },
      },
    },
  },
};

await Bun.write("docs/api/openapi.json", `${JSON.stringify(document, null, 2)}\n`);
console.log("Generated docs/api/openapi.json");
