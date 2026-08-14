package config

import "time"

type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Jwt      JwtConfig
	Redis    RedisConfig
	Cache    CacheConfig
	Security SecurityConfig
	Sync     SyncConfig
}

type AppConfig struct {
	Name    string
	Port    int
	Version string
}

type DatabaseConfig struct {
	Host     string
	Port    int
	Username string
	Password string
	DBName   string
}

type JwtConfig struct {
	Secret        string
	Expire        int
	RefreshExpire int
}

type RedisConfig struct {
	InitAddr        string
	Password        string
	DB              int
	PoolSize        int
	ConnWithTimeout time.Duration
}

type CacheConfig struct {
	Expire  int
	BaseKey string
}

type SecurityConfig struct {
	WhiteList            []string
	SecurityHandler      string
	SecurityHeaderPrefix string
}

type SyncConfig struct {
	PlayerDataInterval int // 玩家数据同步间隔（秒）
	Enabled            bool
}