create table if not exists users
(
    id         bigserial
        primary key,
    name       text,
    password   text,
    email      text,
    role       text   default 'user'::text,
    status     bigint default 1,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

alter table users
    owner to postgres;

create unique index if not exists idx_users_email
    on users (email);

create unique index if not exists idx_users_name
    on users (name);

