import api from './client'

export interface RoutingResponse {
  recommended_specialty_id: number
  recommended_specialty_name: string
  confidence: number
  reasoning: string
  alternative_specialties: {
    specialty_id: number
    specialty_name: string
    confidence: number
  }[]
}

export interface Specialty {
  id: number
  name: string
}

export async function routeComplaint(complaintText: string): Promise<RoutingResponse> {
  const { data } = await api.post('/api/v1/classifier/route-complaint', { complaint_text: complaintText })
  return data
}

export async function getSpecialties(): Promise<Specialty[]> {
  const { data } = await api.get('/api/v1/classifier/specialties')
  return data
}
