import styles from './Services.module.css'

// Banda de confianza (lenguaje icyautomotores.com): local físico,
// financiación y permutas. Datos reales del negocio, sin adjetivos.
const SERVICES = [
  {
    titulo: 'Local físico en Tucumán',
    texto: 'Visitanos en Yerba Buena. Todos los vehículos se pueden ver en persona.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    titulo: 'Financiación disponible',
    texto: 'Trabajamos con bancos y financieras. Consultá las opciones para tu caso.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    titulo: 'Aceptamos permutas',
    texto: 'Tomamos tu usado como parte de pago, con tasación al momento.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
]

export default function Services() {
  return (
    <section id="servicios" className={styles.band} aria-label="Servicios">
      <div className={styles.inner}>
        {SERVICES.map(({ titulo, texto, icon }) => (
          <article key={titulo} className={styles.item}>
            <span className={styles.icon}>{icon}</span>
            <div>
              <h3 className={styles.titulo}>{titulo}</h3>
              <p className={styles.texto}>{texto}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
