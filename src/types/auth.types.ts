export type Plan = 'free' | 'premium'

export interface Profile {
  id: string
  email: string | null
  display_name?: string | null
  plan: Plan
  created_at: string
}
