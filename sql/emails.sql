create table if not exists emails
(
    id         bigserial
        primary key,
    host       text,
    port       bigint,
    "user"     text,
    pass       text,
    max_count  bigint,
    status     bigint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

alter table emails
    owner to postgres;

