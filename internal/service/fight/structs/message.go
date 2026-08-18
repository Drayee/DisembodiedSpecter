package structs

type Attack struct {
	Damage   int
	TargetID int
	SourceID int
	Other    string
}

type BuffMessage struct {
	TargetID int
	SourceID int
	ID       int
	Time     int
	Other    string
}

type Recover struct {
	TargetID int
	SourceID int
	Recover  int
	Other    string
}
