# RigSense Operations

## Monitoring & Alerting
RigSense is instrumented with structured JSON logging (`src/lib/logger.ts`).
- Errors are captured globally via Next.js Error Boundaries (`src/app/global-error.tsx`, `src/app/error.tsx`) and logged.
- Background jobs and provider integrations log explicit start, fail, and complete events.
- To scrape application health, an endpoint is available at `GET /api/health`. This responds with a 200 status when the web server and database are reachable.

## Backup and Recovery Plan

### 1. Database Backups
RigSense data lives entirely in PostgreSQL. If self-hosting using Docker Compose:
- **Logical Backups (pg_dump):** Run daily logical backups of the database.
- **Physical Backups (WAL Archiving):** For point-in-time recovery, configure WAL archiving (e.g. pgBackRest) or rely on a managed DB provider (AWS RDS, Supabase, Vercel Postgres) that handles continuous snapshots automatically.

**Manual Backup Script:**
```bash
docker exec -t rigsense-postgres pg_dumpall -c -U postgres > dump_$(date +%Y-%m-%d_%H_%M_%S).sql
```

### 2. Restoration
To restore a logical backup dump file:
```bash
cat your_dump_file.sql | docker exec -i rigsense-postgres psql -U postgres
```

### 3. Application State Recovery
Since RigSense uses stateless Docker containers, application state recovery consists of:
1. Ensure the PostgreSQL database is restored.
2. Spin up containers `docker compose up -d`.
3. Check `docker compose logs web` to verify successful connection.

## Rate Limiting & Abuse Prevention
RigSense utilizes in-memory rate-limiting out of the box via Next.js Proxy (`src/proxy.ts`). 
For multi-instance deployments, substitute the local map in `src/lib/rate-limit.ts` with Redis.