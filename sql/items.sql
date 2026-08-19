create table if not exists items
(
    id          bigserial
        primary key,
    name        text,
    description text,
    type        text,
    created_at  timestamp with time zone
);

alter table items
    owner to postgres;

