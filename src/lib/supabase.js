import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://hwlzycxbcbtktobogurr.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bHp5Y3hiY2J0a3RvYm9ndXJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTM3OTgsImV4cCI6MjA5MzUyOTc5OH0.jXXELk-nnE_8cnFkH7CJZIINgxCQt9Wn437WiV-aGic'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
