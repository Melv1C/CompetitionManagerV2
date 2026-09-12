# Modular monolith with a separate worker process

Competition Manager will start as a modular monolith with two separate backend applications in the monorepo: `apps/api` for HTTP/auth/realtime and `apps/worker` for background and scheduled jobs. Both consume the same explicit domain and contract packages, keeping business rules and transactions cohesive while allowing scaling, health checks, and deployment to differ; a microservice split is deferred until measured operational need justifies it.
