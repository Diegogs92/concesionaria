'use client'

import { useMemo, useState } from 'react'
import { BRANDS } from '../../lib/brands'
import { waLink } from '../../lib/site'
import WhatsAppIcon from '../icons/WhatsAppIcon'
import styles from './SellSection.module.css'

const PASOS = ['Vehículo', 'Detalles', 'Precio', 'Contacto']

const ANIO_ACTUAL = new Date().getFullYear()
const ANIOS = Array.from({ length: 40 }, (_, i) => ANIO_ACTUAL - i)

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
)

const BikeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="15" cy="5" r="1" />
    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
  </svg>
)

const INICIAL = {
  tipo: '',
  marca: '',
  modelo: '',
  version: '',
  anio: '',
  km: '',
  transmision: '',
  precio: '',
  nombre: '',
  comentario: '',
}

function formatMiles(valor) {
  const digitos = valor.replace(/\D/g, '')
  return digitos ? Number(digitos).toLocaleString('es-AR') : ''
}

// Wizard "Vendé tu vehículo" (réplica del #vende de icyautomotores.com):
// 4 pasos con validación por paso. Sin backend de leads: al finalizar arma
// un mensaje de WhatsApp prellenado con todos los datos hacia el negocio,
// que es donde realmente se atienden las tasaciones.
export default function SellSection() {
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState(INICIAL)

  function set(campo, valor) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
  }

  const valido = useMemo(() => {
    if (paso === 0) return datos.tipo && datos.marca && datos.modelo.trim()
    if (paso === 1) return datos.anio && datos.km !== ''
    if (paso === 2) return true // el precio esperado es opcional
    return datos.nombre.trim()
  }, [paso, datos])

  const mensaje = useMemo(() => {
    const vehiculo = [
      datos.marca,
      datos.modelo.trim(),
      datos.version.trim(),
      datos.anio,
    ].filter(Boolean).join(' ')
    const lineas = [
      `Hola, quiero vender mi ${datos.tipo === 'moto' ? 'moto' : 'auto'}: ${vehiculo}.`,
      datos.km !== '' && `Kilometraje: ${formatMiles(datos.km)} km.`,
      datos.transmision && `Transmisión: ${datos.transmision}.`,
      datos.precio && `Precio esperado: $${formatMiles(datos.precio)}.`,
      datos.comentario.trim() && `Comentario: ${datos.comentario.trim()}`,
      `Soy ${datos.nombre.trim()}.`,
    ]
    return lineas.filter(Boolean).join('\n')
  }, [datos])

  return (
    <section id="vende" className={styles.section}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Vendé</p>
          <h2 className={styles.title}>¿Querés vender tu vehículo?</h2>
          <p className={styles.sub}>Completá los datos y te contactamos para hacer la tasación.</p>
        </header>

        <div className={styles.steps} aria-hidden="true">
          {PASOS.map((label, i) => (
            <div key={label} className={styles.step}>
              <span className={i === paso ? styles.dotActive : i < paso ? styles.dotDone : styles.dot}>
                {i + 1}
              </span>
              <span className={i === paso ? styles.stepLabelActive : styles.stepLabel}>{label}</span>
              {i < PASOS.length - 1 && <span className={styles.stepLine} />}
            </div>
          ))}
        </div>

        <div className={styles.card}>
          {paso === 0 && (
            <div className={styles.fields}>
              <div>
                <p className={styles.label}>Tipo de vehículo</p>
                <div className={styles.tipoGrid}>
                  <button
                    type="button"
                    className={datos.tipo === 'auto' ? styles.tipoActive : styles.tipoBtn}
                    aria-pressed={datos.tipo === 'auto'}
                    onClick={() => set('tipo', 'auto')}
                  >
                    <CarIcon /> Auto
                  </button>
                  <button
                    type="button"
                    className={datos.tipo === 'moto' ? styles.tipoActive : styles.tipoBtn}
                    aria-pressed={datos.tipo === 'moto'}
                    onClick={() => set('tipo', 'moto')}
                  >
                    <BikeIcon /> Moto
                  </button>
                </div>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Marca</span>
                <select className={styles.select} value={datos.marca} onChange={(e) => set('marca', e.target.value)}>
                  <option value="">Seleccionar marca</option>
                  {BRANDS.map(([slug, nombre]) => (
                    <option key={slug} value={nombre}>{nombre}</option>
                  ))}
                  <option value="Otra">Otra</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Modelo</span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder={datos.marca ? 'Ej: Corolla, Amarok, Cronos...' : 'Elegí una marca primero'}
                  disabled={!datos.marca}
                  value={datos.modelo}
                  onChange={(e) => set('modelo', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  Versión <em className={styles.opcional}>(opcional)</em>
                </span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: XLT, LTZ, SEG..."
                  value={datos.version}
                  onChange={(e) => set('version', e.target.value)}
                />
              </label>
            </div>
          )}

          {paso === 1 && (
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Año</span>
                <select className={styles.select} value={datos.anio} onChange={(e) => set('anio', e.target.value)}>
                  <option value="">Seleccionar año</option>
                  {ANIOS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Kilometraje</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="Ej: 85.000"
                  value={formatMiles(datos.km)}
                  onChange={(e) => set('km', e.target.value.replace(/\D/g, ''))}
                />
              </label>

              {datos.tipo === 'auto' && (
                <div>
                  <p className={styles.label}>
                    Transmisión <em className={styles.opcional}>(opcional)</em>
                  </p>
                  <div className={styles.tipoGrid}>
                    <button
                      type="button"
                      className={datos.transmision === 'Manual' ? styles.tipoActive : styles.tipoBtn}
                      aria-pressed={datos.transmision === 'Manual'}
                      onClick={() => set('transmision', datos.transmision === 'Manual' ? '' : 'Manual')}
                    >
                      Manual
                    </button>
                    <button
                      type="button"
                      className={datos.transmision === 'Automática' ? styles.tipoActive : styles.tipoBtn}
                      aria-pressed={datos.transmision === 'Automática'}
                      onClick={() => set('transmision', datos.transmision === 'Automática' ? '' : 'Automática')}
                    >
                      Automática
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {paso === 2 && (
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Precio esperado (ARS) <em className={styles.opcional}>(opcional)</em>
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="Ej: 20.000.000"
                  value={formatMiles(datos.precio)}
                  onChange={(e) => set('precio', e.target.value.replace(/\D/g, ''))}
                />
              </label>
              <p className={styles.hint}>
                Si no tenés un precio en mente, dejalo vacío: la tasación la hacemos juntos.
              </p>
            </div>
          )}

          {paso === 3 && (
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Tu nombre</span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ej: Juan Pérez"
                  value={datos.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  Comentario <em className={styles.opcional}>(opcional)</em>
                </span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Estado, detalles, service al día..."
                  value={datos.comentario}
                  onChange={(e) => set('comentario', e.target.value)}
                />
              </label>
            </div>
          )}

          <div className={styles.nav}>
            {paso > 0 ? (
              <button type="button" className={styles.atras} onClick={() => setPaso((p) => p - 1)}>
                Atrás
              </button>
            ) : (
              <span />
            )}

            {paso < PASOS.length - 1 ? (
              <button
                type="button"
                className={styles.siguiente}
                disabled={!valido}
                onClick={() => setPaso((p) => p + 1)}
              >
                Siguiente
              </button>
            ) : (
              <a
                className={valido ? styles.enviar : styles.enviarDisabled}
                href={valido ? waLink(mensaje) : undefined}
                aria-disabled={!valido}
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                Enviar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
