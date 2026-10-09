#!/bin/sh
set -eu
mkdir -p /backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h postgres -U orynt -d orynt -Fc > "/backups/orynt-$STAMP.dump"
find /backups -type f -name 'orynt-*.dump' -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete
