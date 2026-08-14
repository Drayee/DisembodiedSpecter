package config

import (
	"log"
	"strings"

	"github.com/go-viper/mapstructure/v2"
	"github.com/spf13/viper"
)

func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("$HOME/.config")

	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("读取配置文件失败: %v", err)
		return nil, err
	}

	var appConfig Config
	if err := viper.Unmarshal(&appConfig, func(c *mapstructure.DecoderConfig) {
		c.MatchName = func(mapKey, fieldName string) bool {
			keyWithoutUnderscores := strings.Replace(mapKey, "_", "", -1)
			return strings.EqualFold(keyWithoutUnderscores, fieldName)
		}
	}); err != nil {
		return nil, err
	}
	return &appConfig, nil
}
