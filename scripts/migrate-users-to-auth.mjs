// ─────────────────────────────────────────────────────────────────────────────
// Fix de seguridad — Paso 2: migrar usuarios a Supabase Auth
//
// Crea cada usuario de la tabla `usuarios` en Supabase Auth (con su contraseña
// actual) y completa la columna `auth_id`. Idempotente: podés correrlo varias
// veces; salta los que ya están linkeados y reutiliza los que ya existen en Auth.
//
// USO (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE = '<service_role key del panel>'
//   node scripts/migrate-users-to-auth.mjs
//
// El service_role key se saca de: Supabase → Settings → API → service_role.
// NUNCA lo commitees ni lo pegues en código. Solo como env var, en tu terminal.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import { usernameToEmail } from '../src/lib/authEmail.js'

const SUPABASE_URL = 'https://hwlzycxbcbtktobogurr.supabase.co'
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

if (!SERVICE_ROLE) {
  console.error('✗ Falta la env var SUPABASE_SERVICE_ROLE.')
  console.error("  PowerShell:  $env:SUPABASE_SERVICE_ROLE = '<key>'; node scripts/migrate-users-to-auth.mjs")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // 1. Usuarios de la tabla
  const { data: usuarios, error } = await admin
    .from('usuarios')
    .select('id, username, password, auth_id')
  if (error) throw new Error(`Leyendo usuarios: ${error.message}`)

  // 2. Usuarios que YA existen en Auth (para reusar en re-corridas)
  const { data: page, error: e2 } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (e2) throw new Error(`Listando auth users: ${e2.message}`)
  const byEmail = new Map(page.users.map((u) => [u.email, u.id]))

  const r = { creados: 0, linkeados: 0, yaEstaban: 0, fallidos: 0 }

  for (const u of usuarios) {
    if (u.auth_id) { r.yaEstaban++; continue }

    if (!u.username || !u.password) {
      console.warn(`⚠ ${u.username || '(sin username)'}: sin contraseña, lo salto`)
      r.fallidos++
      continue
    }

    const email = usernameToEmail(u.username)
    let authId = byEmail.get(email)

    if (!authId) {
      const { data, error: ce } = await admin.auth.admin.createUser({
        email,
        password: String(u.password),
        email_confirm: true, // sin verificación por mail (emails sintéticos)
      })
      if (ce) {
        // Causa típica: contraseña < 6 caracteres (mínimo de Supabase Auth)
        console.error(`✗ ${email}: ${ce.message}`)
        r.fallidos++
        continue
      }
      authId = data.user.id
      r.creados++
    }

    const { error: ue } = await admin.from('usuarios').update({ auth_id: authId }).eq('id', u.id)
    if (ue) {
      console.error(`✗ linkeando ${email}: ${ue.message}`)
      r.fallidos++
      continue
    }
    r.linkeados++
    console.log(`✓ ${u.username} → ${email}`)
  }

  console.log(`\nResumen: creados=${r.creados} linkeados=${r.linkeados} ya-estaban=${r.yaEstaban} fallidos=${r.fallidos}`)
  if (r.fallidos > 0) {
    console.log('Revisá los ✗ de arriba. Causa común: contraseña de menos de 6 caracteres.')
    process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
