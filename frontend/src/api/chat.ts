import api from './client'

export interface ChatContact {
  user_id: number
  full_name: string
  role: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
}

export interface ChatMessage {
  id: number
  sender_id: number
  receiver_id: number
  message_text: string
  sent_at: string
  is_delivered: boolean
  is_read: boolean
}

export async function getContacts(): Promise<ChatContact[]> {
  const { data } = await api.get('/chat/contacts')
  return data
}

export async function getMessages(userId: number): Promise<ChatMessage[]> {
  const { data } = await api.get(`/chat/messages/${userId}`)
  return data
}
