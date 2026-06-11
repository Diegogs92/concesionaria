import Link from 'next/link'

export const metadata = { title: 'Página no encontrada | ICY Automotores' }

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '70svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 64px)',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
        Este vehículo ya no está publicado.
      </h1>
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, maxWidth: '52ch' }}>
        Puede que se haya vendido o despublicado. El stock se actualiza en vivo,
        así que lo que ves en el catálogo es lo que hay.
      </p>
      <Link
        href="/#stock"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: 50,
          padding: '0 26px',
          marginTop: 24,
          borderRadius: 'var(--radius)',
          background: 'var(--accent)',
          color: '#ffffff',
          fontWeight: 600,
        }}
      >
        Ver el stock
      </Link>
    </main>
  )
}
