import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { readEnvironmentVariable } from '../env'

const supabaseUrl = readEnvironmentVariable(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = readEnvironmentVariable(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const isSupabaseConfigured = supabaseUrl !== undefined && supabaseAnonKey !== undefined

export const supabaseClient: SupabaseClient | null =
  supabaseUrl !== undefined && supabaseAnonKey !== undefined
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null
