# Modular monolith with a separate worker process

Competition Manager will start as one modular backend source with explicit module ownership, exposed through an API process and a separate worker process. This keeps domain transactions and deployment simple while allowing scheduled work, retries, and provider calls to be isolated from request latency; a microservice split is deferred until measured operational need justifies it.
