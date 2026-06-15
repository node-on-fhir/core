# CLAUDE.md — @node-on-fhir/workqueues

Migrated from Atmosphere `clinical:workqueues` (2026-06-13). Work queues / task management. Route `/workqueues`. Atmosphere client mainModule was client/index.js (re-export hub); consolidated into self-contained client.js that builds routes/sidebar from workflow.json and re-exports the library surface (collections WorkQueues/WorkQueueItems, components, pages, hooks). Kept server/index.js (rest/hooks/methods/publications/migrations). simpl-schema peer (present). `list`→`List`. Monorepo-tracked → fresh git init.
