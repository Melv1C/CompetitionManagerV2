# Deploy immutable Docker images through Dokploy-compatible topology

The initial deployment targets immutable Docker images for the backend API, backend worker, frontend, manager, and admin, with backed-up PostgreSQL and Redis as shared infrastructure and static apps served by Nginx or an equivalent immutable server. Docker and Dokploy-compatible manifests keep local, test, staging, and production topology explicit while supporting health checks, graceful shutdown, rolling releases, rollback, and forward-safe migrations.
