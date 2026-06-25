import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Hekbot] Missing Supabase env vars. Copy .env.example to .env and fill in your project URL and anon key.'
  )
}

// Fall back to placeholder values so the module loads and the UI renders
// without credentials — queries will fail gracefully via hook error states.
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
