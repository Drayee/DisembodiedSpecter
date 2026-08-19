create table if not exists player_items
(
    player_id  bigint not null
        constraint player_items_players_id_fk
            references players
            on update cascade on delete cascade,
    item_id    bigint not null
        constraint player_items_items_id_fk
            references items
            on update set default on delete cascade,
    num        bigint,
    attribute  text,
    created_at timestamp with time zone,
    primary key (player_id, item_id)
);

alter table player_items
    owner to postgres;

