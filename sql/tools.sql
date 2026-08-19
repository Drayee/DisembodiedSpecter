create table if not exists tools
(
    id          bigserial
        primary key,
    name        text,
    description text,
    created_at  timestamp with time zone,
    updated_at  timestamp with time zone
);

alter table tools
    owner to postgres;

create unique index if not exists idx_tools_name
    on tools (name);

