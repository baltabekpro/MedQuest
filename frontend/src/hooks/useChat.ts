import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getContacts, getMessages, type ChatMessage, type ChatContact } from '@/api/chat'
import { useAuthStore } from '@/store/authStore'

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')

export function useChat() {
  const queryClient = useQueryClient()
  const { accessToken } = useAuthStore()
  const wsRef = useRef<WebSocket | null>(null)
  const [activeUserId, setActiveUserId] = useState<number | null>(null)
  const [wsMessages, setWsMessages] = useState<ChatMessage[]>([])

  const contacts = useQuery<ChatContact[]>({
    queryKey: ['chat', 'contacts'],
    queryFn: getContacts,
    refetchInterval: 10000,
  })

  const history = useQuery<ChatMessage[]>({
    queryKey: ['chat', 'messages', activeUserId],
    queryFn: () => getMessages(activeUserId!),
    enabled: activeUserId !== null,
  })

  // Sync history into wsMessages when switching contacts
  useEffect(() => {
    if (history.data) setWsMessages(history.data)
  }, [history.data])

  // WebSocket connection
  useEffect(() => {
    if (!accessToken) return

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${accessToken}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'new_message') {
        setWsMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        queryClient.invalidateQueries({ queryKey: ['chat', 'contacts'] })
      }
    }

    ws.onclose = () => {
      // reconnect handled by React strict mode re-mount
    }

    return () => {
      ws.close()
    }
  }, [accessToken, queryClient])

  const sendMessage = useCallback((receiverId: number, text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ receiver_id: receiverId, message_text: text }))
  }, [])

  const selectContact = useCallback((userId: number) => {
    setActiveUserId(userId)
  }, [])

  return {
    contacts: contacts.data ?? [],
    contactsLoading: contacts.isLoading,
    messages: wsMessages,
    messagesLoading: history.isLoading,
    activeUserId,
    selectContact,
    sendMessage,
  }
}
