# 生成合并后的 proto 模块：战斗 + 大世界消息合并进同一个 namespace proto。
# 注意：必须单次 pbjs 调用 —— 两个 .proto 都声明 package proto，
# 分开两次生成会共用 $protobuf.roots["default"] 并互相覆盖 $root.proto，导致运行时找不到消息类。
pbjs -t static-module -w commonjs -o assets/Scripts/api/websocket/proto/messages.js assets/resources/protos/fight_message.proto assets/resources/protos/global_message.proto

pbts -o assets/Scripts/api/websocket/proto/messages.d.ts assets/Scripts/api/websocket/proto/messages.js
