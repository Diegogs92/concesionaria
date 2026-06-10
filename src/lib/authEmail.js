// Email sintético para Supabase Auth.
//
// Los usuarios internos entran con `username` (ej: "nico"), pero Supabase Auth
// requiere un email. Mapeamos username -> email sintético de forma DETERMINÍSTICA.
//
// CRÍTICO: este mismo mapeo se usa al CREAR los usuarios (script de migración)
// y al hacer LOGIN (AuthContext). Si cambiás el dominio, los usuarios ya
// creados dejan de poder loguear. No lo cambies después de la migración.

export const AUTH_EMAIL_DOMAIN = 'concesionarias.vercel.app'

export const usernameToEmail = (username) =>
  `${String(username).trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`
