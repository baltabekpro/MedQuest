import { MessageSquare, Send, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export const ChatPage = () => {
  const { user } = useAuthStore()
  const { contacts, messages, activeUserId, selectContact, sendMessage, contactsLoading } = useChat()
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeContact = contacts.find((c) => c.user_id === activeUserId)

  const handleSend = () => {
    if (!text.trim() || !activeUserId) return
    sendMessage(activeUserId, text.trim())
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    doctor: 'bg-blue-100 text-blue-700',
    nurse: 'bg-green-100 text-green-700',
    registrar: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Contact list */}
      <Card className="flex w-80 flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
            <MessageSquare className="h-5 w-5" /> Чат
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="p-4 text-center text-sm text-muted">Загрузка...</div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">Нет контактов</div>
          ) : (
            contacts.map((c) => (
              <button
                key={c.user_id}
                onClick={() => selectContact(c.user_id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition hover:bg-slate-50',
                  activeUserId === c.user_id && 'bg-blue-50 hover:bg-blue-50',
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-text">{c.full_name}</span>
                    {c.unread_count > 0 && (
                      <Badge className="ml-2 h-5 min-w-5 justify-center rounded-full bg-blue-600 px-1 text-[10px]">
                        {c.unread_count}
                      </Badge>
                    )}
                  </div>
                  {c.last_message && (
                    <p className="truncate text-xs text-muted">{c.last_message}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {activeUserId && activeContact ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <div>
                <span className="font-medium text-text">{activeContact.full_name}</span>
                <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[10px]', roleColors[activeContact.role] || 'bg-slate-100 text-slate-600')}>
                  {activeContact.role}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn('flex', msg.sender_id === user?.id ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                      msg.sender_id === user?.id
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-slate-100 text-text rounded-bl-md',
                    )}
                  >
                    <p>{msg.message_text}</p>
                    <p className={cn('mt-1 text-[10px]', msg.sender_id === user?.id ? 'text-blue-200' : 'text-slate-400')}>
                      {new Date(msg.sent_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-border p-4">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Сообщение..."
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!text.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-muted">
              <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Выберите контакт для начала переписки</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
