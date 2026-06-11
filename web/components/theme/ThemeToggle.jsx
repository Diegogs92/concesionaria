'use client'

import styles from './ThemeToggle.module.css'

// El tema vigente vive en <html data-theme> (lo setea el script inline del
// layout antes del primer paint). El botón solo lo invierte y persiste.
// Qué ícono se ve lo decide el CSS según [data-theme], así el SSR no
// necesita conocer el tema y no hay mismatch de hidratación.
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem('icy-theme', next)
    } catch {
      // sin storage (modo incógnito estricto): el cambio vale para la sesión
    }
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label="Cambiar tema claro/oscuro"
      title="Cambiar tema"
    >
      {/* Luna: visible en tema claro (acción = pasar a oscuro) */}
      <svg className={styles.lightsOn} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      {/* Sol: visible en tema oscuro (acción = pasar a claro) */}
      <svg className={styles.lightsOff} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </button>
  )
}
