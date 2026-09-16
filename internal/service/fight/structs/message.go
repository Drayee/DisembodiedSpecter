package structs

// 战斗事件载荷：pubsub 上传输的内容，同时也是结算的输入。
//
// Ref 是**效果的来源**，由发布方声明，会原样透传进战斗日志（见 fight_log.go 的正负约定）：
//
//	> 0 → 技能 ID ；< 0 → −buffID ；= 0 → 被动（含普攻、永久行为）
//
// 之所以要求发布方显式填写：只有发布点自己知道"这一下是技能打的、buff 触发的，还是被动补的"，
// 结算侧无法反推。
type Attack struct {
	Damage   int
	TargetID int
	SourceID int
	Other    string
	Ref      int // 伤害来源：技能 ID / −buffID / 0 被动
}

type BuffMessage struct {
	TargetID int
	SourceID int
	ID       int
	Time     int
	Other    string
	Ref      int // 施加来源：技能 ID / −buffID / 0 被动
}

type Recover struct {
	TargetID int
	SourceID int
	Recover  int
	Other    string
	Ref      int // 恢复来源：技能 ID / −buffID / 0 被动
}

type DamageType int

const (
	DamageTypeNormal   DamageType = iota
	DamageTypePhysical DamageType = iota
	DamageTypeThunder  DamageType = iota
	DamageTypeFire     DamageType = iota
	DamageTypeReally   DamageType = iota
)
