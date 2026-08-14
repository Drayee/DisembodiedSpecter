package eventbus

type DamageEvent struct {
	From   int // 伤害来源
	To     int // 伤害目标
	Damage int // 伤害值
	Type   int // 伤害类型
}

type RecoverEvent struct {
	From    int // 恢复来源
	To      int // 恢复目标
	Recover int // 恢复值
}

type ToolEvent struct {
	ToolID int // 道具ID
	To     int // 道具目标
}

type CharacterEvent struct {
	Type   int // 事件类型
	Detail any // 事件详情
}
