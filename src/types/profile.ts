// ============================================
// TIPOS DE PERFIL DE USUARIO
// Refleja la tabla `profiles` de Supabase
// ============================================

export type UserPlan = 'free' | 'premium'

export interface Profile {
  id: string              // UUID — mismo que auth.users.id
  email: string
  display_name: string | null
  plan: UserPlan
  created_at: string
  updated_at: string
}

// Tipo para actualizar perfil (campos opcionales)
export type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'plan'>>
