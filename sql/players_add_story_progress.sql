-- 剧情进度落库（players 表新增列）
-- 说明：Story 组件单人单档进度，后端通过 global WebSocket 的 story.save 消息接收，
-- 先写入 Redis（private:player:data:{playerID} Hash 的 story_progress 字段），
-- 再由同步任务落 SQL。此列用于 Redis 过期后从库回填，保证进度不丢。
-- 已存在的库执行一次即可（幂等）：

alter table players
    add column if not exists story_progress text;

alter table players
    owner to postgres;
