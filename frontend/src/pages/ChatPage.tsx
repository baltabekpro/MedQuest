import { MessageSquare, Search, Send, User, UserPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  doctor: 'Врач',
  nurse: 'Медсестра',
  registrar: 'Регистратор',
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  doctor: 'bg-blue-100 text-blue-700',
  nurse: 'bg-green-100 text-green-700',
  registrar: 'bg-orange-100 text-orange-700',
}

export const ChatPage = () => {
  const { user } = useAuthStore()
  const { contacts, messages, activeUserId, selectContact, sendMessage, contactsLoading, staff, startChat } = useChat()
  const [text, setText] = useState('')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
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

  const handleSelectStaff = (userId: number) => {
    startChat(userId)
    setDialogOpen(false)
    setSearch('')
  }

  // Group staff by role and filter by search
  const filteredStaff = search
    ? staff.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()))
    : staff

  const groupedStaff = filteredStaff.reduce<Record<string, typeof staff>>((acc, s) => {
    ;(acc[s.role] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Contact list */}
      <Card className="flex w-80 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
            <MessageSquare className="h-5 w-5" /> Чат
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserPlus className="h-4 w-4" />
                Новый чат
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogTitle>Выберите сотрудника</DialogTitle>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по имени..."
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="mt-3 max-h-80 overflow-y-auto">
                {staff.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">Нет сотрудников</p>
                ) : filteredStaff.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">Не найдено</p>
                ) : (
                  Object.entries(groupedStaff).map(([role, members]) => (
                    <div key={role} className="mb-3">
                      <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wider text-muted">
                        {roleLabels[role] || role}
                      </p>
                      {members.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectStaff(s.id)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="truncate text-sm font-medium text-text">{s.full_name}</span>
                          </div>
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px]', roleColors[role] || 'bg-slate-100 text-slate-600')}>
                            {roleLabels[role] || role}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
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
                  {roleLabels[activeContact.role] || activeContact.role}
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
