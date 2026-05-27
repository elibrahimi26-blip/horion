# syntax=docker/dockerfile:1.7
#
# Service "backup-cron" — exécute pg_dump tous les jours à 03:00.
# Partage le volume `backups_data` avec le service app.
#
FROM alpine:3.20

RUN apk add --no-cache postgresql16-client tini tzdata && \
    cp /usr/share/zoneinfo/Europe/Paris /etc/localtime && \
    echo "Europe/Paris" > /etc/timezone

COPY docker/scripts/backup-cron.sh /usr/local/bin/backup-cron.sh
RUN chmod +x /usr/local/bin/backup-cron.sh && \
    mkdir -p /var/spool/cron/crontabs && \
    echo "0 3 * * * /usr/local/bin/backup-cron.sh > /proc/1/fd/1 2>&1" > /var/spool/cron/crontabs/root

VOLUME ["/backups"]

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["crond", "-f", "-l", "2"]
