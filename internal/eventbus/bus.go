package eventbus

import (
	"sync"
	"sync/atomic"
)

// Handler 定义了事件处理函数的标准签名
// 使用泛型 T 代表具体的事件数据类型
type Handler[T any] func(event T)

// Subscription 用于保存订阅信息的凭证，方便后续注销监听
type Subscription struct {
	id int64
}

// EventBus 是一个泛型事件总线，针对特定的事件类型 T 实例化
type EventBus[T any] struct {
	mu       sync.RWMutex
	handlers map[int64]Handler[T]
	nextID   atomic.Int64
}

// New 实例化一个新的事件总线
func New[T any]() *EventBus[T] {
	return &EventBus[T]{
		handlers: make(map[int64]Handler[T]),
	}
}

// Subscribe 订阅事件，返回一个凭证用于取消订阅
func (bus *EventBus[T]) Subscribe(handler Handler[T]) Subscription {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	// 原子递增生成唯一的 handler ID
	id := bus.nextID.Add(1)
	bus.handlers[id] = handler

	return Subscription{id: id}
}

// Unsubscribe 通过订阅凭证注销监听器
func (bus *EventBus[T]) Unsubscribe(sub Subscription) {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	delete(bus.handlers, sub.id)
}

// Publish 广播事件到所有订阅者
func (bus *EventBus[T]) Publish(event T) {
	bus.mu.RLock()
	// 为了防止回调函数内部执行耗时操作或者死锁，建议将当前所有 handler 拷贝一份再执行
	// 这样在派发事件时就不会长时间阻塞别的 Goroutine 注册/注销监听器
	handlersCopy := make([]Handler[T], 0, len(bus.handlers))
	for _, h := range bus.handlers {
		handlersCopy = append(handlersCopy, h)
	}
	bus.mu.RUnlock()

	// 同步执行回调，保证游戏业务逻辑的时序性
	for _, handle := range handlersCopy {
		handle(event)
	}
}
