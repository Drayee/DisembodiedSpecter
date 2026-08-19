create table if not exists enemies
(
    id          bigserial
        primary key,
    name        text,
    health      bigint,
    type        text,
    description text,
    created_at  timestamp with time zone,
    updated_at  timestamp with time zone
);

alter table enemies
    owner to postgres;

create unique index if not exists idx_enemies_name
    on enemies (name);

