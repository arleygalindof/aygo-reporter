FROM postgres:15-alpine

COPY init.sql /docker-entrypoint-initdb.d/

ENV POSTGRES_USER=${DB_USER:-postgres}
ENV POSTGRES_PASSWORD=${DB_PASSWORD:-postgres}

EXPOSE 5432
