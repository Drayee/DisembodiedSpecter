package utils

import (
	"DisembodiedSpecter/internal/domain"
	"DisembodiedSpecter/internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strconv"
	"time"

	"github.com/redis/rueidis"
	"gopkg.in/gomail.v2"
)

type MailManager struct {
	emailRepo      repository.EmailRepo
	redisClient    rueidis.Client
	usableEmailNum int
}

type Email struct {
	Receiver string
	Subject  string
	Body     string
}

func NewMailManager(emailRepo repository.EmailRepo, redisClient rueidis.Client) MailManager {
	emails, err := emailRepo.GetAll(context.Background())
	if err != nil {
		log.Fatalf("获取所有邮箱失败: %v", err)
	}
	for _, email := range emails {
		key := fmt.Sprintf("public:datebase:email:%d", email.ID)
		emailJSON, _ := json.Marshal(email)
		cmd := redisClient.B().Set().Key(key).Value(string(emailJSON)).Build()
		if err := redisClient.Do(context.Background(), cmd).Error(); err != nil {
			log.Fatalf("设置邮箱到Redis失败: %v", err)
		}
	}
	r := MailManager{emailRepo: emailRepo, redisClient: redisClient}
	if err := r.GetAllUsableEmails(context.Background()); err != nil {
		log.Fatalf("获取所有可用邮箱失败: %v", err)
	}
	return r
}

func (e *MailManager) GetAllUsableEmails(ctx context.Context) error {
	cmd := e.redisClient.B().Keys().Pattern("public:datebase:email:*").Build()
	keys, err := e.redisClient.Do(ctx, cmd).AsStrSlice()
	if err != nil {
		return err
	}
	usableNum := 0
	for _, key := range keys {
		r, err := e.redisClient.Do(ctx, e.redisClient.B().Get().Key(key).Build()).ToString()
		if err != nil {
			log.Fatalf("获取邮箱失败: %v", err)
		}
		var email domain.Email
		if err := json.Unmarshal([]byte(r), &email); err != nil {
			continue
		}
		if email.Status == 1 {
			usableNum++
		} else if email.UpdatedAt.AddDate(0, 0, 1).Before(time.Now()) {
			usableNum++
			hincrCmd := e.redisClient.B().Hset().Key(fmt.Sprintf("public:usable_email:%d", usableNum)).
				FieldValue().
				FieldValue("host", email.Host).
				FieldValue("port", strconv.Itoa(email.Port)).
				FieldValue("user", email.User).
				FieldValue("pass", email.Pass).
				FieldValue("max_count", strconv.Itoa(email.MaxCount)).
				FieldValue("count", "0").Build()
			if err := e.redisClient.Do(ctx, hincrCmd).Error(); err != nil {
				return err
			}
			email.UpdatedAt = time.Now()
			email.Status = 1
		} else {
			email.Status = 0
		}
		emailJSON, _ := json.Marshal(email)
		key := fmt.Sprintf("public:datebase:email:%d", email.ID)
		cmd := e.redisClient.B().Set().Key(key).Value(string(emailJSON)).Build()
		if err := e.redisClient.Do(ctx, cmd).Error(); err != nil {
			return err
		}
	}
	if usableNum == 0 {
		return fmt.Errorf("没有可用的邮箱")
	}
	e.usableEmailNum = usableNum
	log.Printf("可用邮箱数量: %d", usableNum)
	return nil
}

func (e *MailManager) SendEmail(ctx context.Context, email Email) error {
	for range 2 {
		for e.usableEmailNum != 0 {
			key := fmt.Sprintf("public:usable_email:%d", rand.Intn(e.usableEmailNum)+1)
			nCmd := e.redisClient.B().Hincrby().Key(key).Field("count").Increment(1).Build()
			count, err := e.redisClient.Do(ctx, nCmd).AsInt64()
			if err != nil {
				e.usableEmailNum--
				continue
			}
			mCmd := e.redisClient.B().Hget().Key(key).Field("max_count").Build()
			maxCount, err := e.redisClient.Do(ctx, mCmd).AsInt64()
			if err != nil {
				e.usableEmailNum--
				continue
			}
			if count > maxCount {
				delCmd := e.redisClient.B().Del().Key(key).Build()
				if err := e.redisClient.Do(ctx, delCmd).Error(); err != nil {
					e.usableEmailNum--
					continue
				}
			}
			host, hostErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("host").Build()).ToString()
			port, portErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("port").Build()).AsInt64()
			user, userErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("user").Build()).ToString()
			pass, passErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("pass").Build()).ToString()
			if portErr != nil || hostErr != nil || userErr != nil || passErr != nil {
				e.usableEmailNum--
				continue
			}
			// 发送邮件
			m := gomail.NewMessage()
			m.SetHeader("From", user)
			m.SetHeader("To", email.Receiver)
			m.SetHeader("Subject", email.Subject)
			m.SetBody("text/html", email.Body)
			dialer := gomail.NewDialer(host, int(port), user, pass)
			if err := dialer.DialAndSend(m); err != nil {
				continue
			}
			e.usableEmailNum--
		}
		if err := e.GetAllUsableEmails(ctx); err != nil {
			return err
		}
	}
	return fmt.Errorf("发送邮件失败")
}

func (e *MailManager) StartEmailWorker(taskQueue <-chan Email) {
	go func() {
		for {
			emailTaskNum := len(taskQueue)
			if emailTaskNum <= 100 {
				time.Sleep(time.Second)
				continue
			} else {
				ctx := context.Background()
				for emailTaskNum > 0 {
					key := fmt.Sprintf("public:datebase:email:%d", rand.Intn(e.usableEmailNum)+1)
					n, nErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("count").Build()).AsInt64()
					m, mErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("max_count").Build()).AsInt64()
					port, portErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("port").Build()).AsInt64()
					host, hostErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("host").Build()).ToString()
					user, userErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("user").Build()).ToString()
					pass, passErr := e.redisClient.Do(ctx, e.redisClient.B().Hget().Key(key).Field("pass").Build()).ToString()
					if nErr != nil || mErr != nil || portErr != nil || hostErr != nil || userErr != nil || passErr != nil {
						log.Printf("获取邮箱信息失败: %v, %v, %v, %v, %v, %v", nErr, mErr, portErr, hostErr, userErr, passErr)
						continue
					}
					if err := e.redisClient.Do(ctx, e.redisClient.B().Del().Key(key).Build()).Error(); err != nil {
						log.Printf("删除邮箱失败: %v", err)
						continue

					}
					sendableEmail := int(m - n)
					if sendableEmail >= emailTaskNum {
						sendableEmail = emailTaskNum
						emailTaskNum = 0
					} else {
						emailTaskNum -= sendableEmail
					}
					func() {
						d := gomail.NewDialer(host, int(port), user, pass)
						s, err := d.Dial()
						if err != nil {
							return
						}
						defer func(s gomail.SendCloser) {
							err := s.Close()
							if err != nil {
								log.Fatalf("关闭邮箱失败: %v", err)
							}
						}(s)
						for range sendableEmail {
							email := <-taskQueue
							m := gomail.NewMessage()
							m.SetHeader("From", user)
							m.SetHeader("To", email.Receiver)
							m.SetHeader("Subject", email.Subject)
							m.SetBody("text/html", email.Body)
							if err := gomail.Send(s, m); err != nil {
								log.Printf("发送邮件失败: %v", err)
							}
						}
					}()
				}
			}
		}
	}()
}

func (e *MailManager) Create(ctx context.Context, email *domain.Email) error {
	e1 := e.emailRepo.Create(ctx, email)
	emailJSON, _ := json.Marshal(email)
	e2 := e.redisClient.Do(ctx, e.redisClient.B().Set().Key(fmt.Sprintf("public:datebase:email:%d", email.ID)).Value(string(emailJSON)).Build()).Error()
	if e1 != nil || e2 != nil {
		return fmt.Errorf("创建邮箱失败: %v, %v", e1, e2)
	}
	return nil
}

func (e *MailManager) Delete(ctx context.Context, email *domain.Email) error {
	e1 := e.emailRepo.Delete(ctx, email)
	e2 := e.redisClient.Do(ctx, e.redisClient.B().Del().Key(fmt.Sprintf("public:datebase:email:%d", email.ID)).Build()).Error()
	if e1 != nil || e2 != nil {
		return fmt.Errorf("删除邮箱失败: %v, %v", e1, e2)
	}
	return nil
}

func (e *MailManager) Update(ctx context.Context, email *domain.Email) error {
	e1 := e.emailRepo.Update(ctx, email)
	emailJSON, _ := json.Marshal(email)
	e2 := e.redisClient.Do(ctx, e.redisClient.B().Set().Key(fmt.Sprintf("public:datebase:email:%d", email.ID)).Value(string(emailJSON)).Build()).Error()
	if e1 != nil || e2 != nil {
		return fmt.Errorf("更新邮箱失败: %v, %v", e1, e2)
	}
	return nil
}
