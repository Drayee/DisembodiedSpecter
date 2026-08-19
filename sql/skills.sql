create table if not exists skills
(
    id           bigserial
        primary key,
    character_id bigint
        constraint skills_characters_id_fk
            references characters
            on update set default on delete cascade,
    name         text,
    type         text,
    description  text,
    created_at   timestamp with time zone,
    updated_at   timestamp with time zone
);

alter table skills
    owner to postgres;

create unique index if not exists idx_skills_name
    on skills (name);

create index if not exists idx_skills_character_id
    on skills (character_id);

