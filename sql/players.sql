create table if not exists players
(
    id                bigserial
        primary key,
    description       text,
    level             bigint,
    exp               bigint,
    location          text,
    is_active         boolean,
    least_active_type text,
    least_active_ip   text,
    least_active_at   timestamp with time zone
);

alter table players
    owner to postgres;

create index if not exists idx_players_is_active
    on players (is_active);

