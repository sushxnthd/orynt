# Orynt production runbook

## Deploy
1. Copy `.env.production.example` to `.env.production` and replace every secret.
2. Point `ORYNT_DOMAIN` DNS at the host.
3. From `infra/`, run `docker compose --env-file ../.env.production -f docker-compose.prod.yml up -d --build`.
4. Apply schema once with `docker compose ... exec app pnpm db:push --force` during the current pre-migration release phase. Before multi-school production, freeze generated migrations and use `db:migrate` only.
5. Verify `/api/health/ready` over HTTPS.

## Secrets
Connector tokens are never stored in `source_systems.config`. Store them in the deployment secret store/environment and save only the environment-variable name as `secretRef`.

## Backups and restore
The backup service performs daily compressed `pg_dump` snapshots and retains 14 days by default. Copy backups off-host/object storage in real production. Restore into an isolated database first: `pg_restore --clean --if-exists -d <target> <dump>` and run smoke tests before cutover.

## Observability
Caddy emits JSON access logs. Application readiness checks include database connectivity. Send container stdout/stderr to the deployment log backend and alert on readiness failures, 5xx rate, connector failures, database storage, backup age and edge-agent last-seen age.

## Edge Vision
Provision an edge token from `/api/vision/edge/register`. Run the edge container on a school-controlled host with RTSP URLs and the token provided only through environment secrets. The default detector tracks anonymous person boxes ephemerally; no face embeddings or identity histories are produced.

## Recovery
Document RPO/RTO per school contract. Test database restoration and edge-agent reprovisioning at least quarterly. Rotate session, connector and edge credentials after a suspected compromise.
