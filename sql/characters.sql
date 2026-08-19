create table if not exists characters
(
    id           bigserial
        primary key,
    name         text,
    health       bigint,
    type         text,
    description  text,
    owner_number bigint,
    created_at   timestamp with time zone,
    updated_at   timestamp with time zone
);

alter table characters
    owner to postgres;

create index if not exists idx_characters_owner_number
    on characters (owner_number);

create unique index if not exists idx_characters_name
    on characters (name);

