'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import styles from './Hero.module.css'

// El flicker de encendido se ve una sola vez por sesión; después el faro
// prende limpio (la sorpresa no sobrevive a la repetición).
const FLICKER_KEY = 'icy-hero-flicker-done'

// Auto a oscuras (cutout con fondo transparente sobre el negro del hero):
// los faros se encienden al pasar el mouse por el vehículo (desktop) o
// solos al entrar al viewport (touch). Las luces son capas de gradiente
// con blend screen sobre los faros apagados de la foto; el estado
// apagado/encendido es solo CSS (.lit), acá vive el mínimo JS.
export default function HeadlightScene({ vehicle, visible = true }) {
  const sceneRef = useRef(null)
  const frameRef = useRef(null)
  const igniteTimer = useRef(0)
  const [lit, setLit] = useState(false)
  const [flicker, setFlicker] = useState(false)

  function ignite() {
    setLit(true)
    try {
      if (!sessionStorage.getItem(FLICKER_KEY)) {
        sessionStorage.setItem(FLICKER_KEY, '1')
        setFlicker(true)
      }
    } catch {
      // sin storage: el flicker se repite, no es grave
      setFlicker(true)
    }
  }

  // Entrada con física de coche, integrada por rAF (escribe el transform
  // directo al DOM, sin estado de React por frame — mismo patrón que el
  // viejo ParallaxFallback). Tres fases reales:
  //   1. crucero: entra a velocidad constante
  //   2. frenada: desaceleración constante → la suspensión carga la trompa
  //      (resorte amortiguado excitado por la desaceleración, no keyframes)
  //   3. detención: la desaceleración desaparece de golpe → el resorte
  //      libera y la carrocería rebota hasta asentarse
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = frameRef.current
    if (!el) return

    const DELAY = 0.2 // s, arranca con el reveal del copy
    const X0 = 26 // % de desplazamiento inicial (fuera de posición)
    const T_CRUISE = 0.42 // s a velocidad constante
    const T_BRAKE = 0.65 // s de frenada constante hasta detenerse
    const V0 = X0 / (T_CRUISE + T_BRAKE / 2) // %/s para recorrer X0
    const A_BRAKE = V0 / T_BRAKE // %/s² (constante: así frena un auto)

    // Suspensión: oscilador amortiguado (ζ≈0.35 → ~1 rebote y medio)
    const K = 160 // rigidez
    const C = 9 // amortiguación
    const GAIN = 0.026 // deg por %/s² de frenada (pico ≈ -1.3deg)

    let theta = 0 // pitch (deg), negativo = trompa abajo
    let omega = 0
    let start
    let prevNow
    let raf = 0

    const step = (now) => {
      if (start === undefined) {
        start = now
        prevNow = now
        el.style.opacity = '0'
        el.style.transform = `translate3d(${X0}%, 0, 0)`
        raf = requestAnimationFrame(step)
        return
      }
      const dt = Math.min((now - prevNow) / 1000, 0.032)
      prevNow = now
      const t = (now - start) / 1000 - DELAY

      if (t < 0) {
        raf = requestAnimationFrame(step)
        return
      }

      // posición y desaceleración según fase
      let x
      let decel = 0
      if (t < T_CRUISE) {
        x = X0 - V0 * t
      } else if (t < T_CRUISE + T_BRAKE) {
        const tb = t - T_CRUISE
        x = X0 - V0 * T_CRUISE - V0 * tb + (A_BRAKE * tb * tb) / 2
        decel = A_BRAKE
      } else {
        x = 0
      }

      // la frenada empuja la trompa hacia abajo; al detenerse, libera
      const thetaTarget = -GAIN * decel
      for (let i = 0; i < 2; i++) {
        const h = dt / 2
        omega += (K * (thetaTarget - theta) - C * omega) * h
        theta += omega * h
      }

      // la carrocería se hunde apenas cuando la trompa carga
      const y = Math.max(0, -theta) * 0.22

      el.style.opacity = String(Math.min(t / 0.18 + 0.001, 1))
      el.style.transform = `translate3d(${x}%, ${y}%, 0) rotate(${theta}deg)`

      const settled =
        t > T_CRUISE + T_BRAKE && Math.abs(theta) < 0.02 && Math.abs(omega) < 0.1
      if (settled) {
        el.style.opacity = ''
        el.style.transform = ''
        return
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      el.style.opacity = ''
      el.style.transform = ''
    }
  }, [])

  useEffect(() => {
    // Con hover real el encendido lo maneja el mouse sobre el auto.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    // Touch: encendido automático único cuando la escena entra al viewport.
    const el = sceneRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        igniteTimer.current = window.setTimeout(ignite, 800)
      },
      { threshold: 0.35 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(igniteTimer.current)
    }
  }, [])

  const sceneClass = [
    styles.scene,
    lit ? styles.lit : '',
    flicker ? styles.flicker : '',
  ].join(' ')

  // Tuning por vehículo: marco, pivote del cabeceo y haz del piso van como
  // CSS vars; el CSS las toma con el auto como valor por defecto.
  const frameStyle = {
    '--frame-w': `${vehicle.frame.maxWidth}px`,
    '--frame-ratio': vehicle.frame.ratio,
    '--pivot': vehicle.frame.pivot,
    '--beam-left': vehicle.beam.left,
    '--beam-top': vehicle.beam.top,
    '--beam-w': vehicle.beam.width,
    '--beam-h': vehicle.beam.height,
  }

  return (
    // .scene = stage oscuro (fondo fijo, NO se funde con la rotación).
    <div ref={sceneRef} className={sceneClass} aria-hidden="true">
      {/* El marco coincide con el bounding box del vehículo: hover sobre el
          marco = hover sobre el vehículo. Acá vive la física (transform +
          opacity de entrada). */}
      <div
        ref={frameRef}
        className={styles.carFrame}
        style={frameStyle}
        onMouseEnter={ignite}
        onMouseLeave={() => setLit(false)}
      >
        {/* .fade = solo el vehículo se funde al rotar (no el stage). Es un
            elemento aparte del marco para no pelear por opacity con la física. */}
        <div className={styles.fade} style={{ opacity: visible ? 1 : 0 }}>
          <Image
            src={vehicle.base}
            alt=""
            fill
            priority
            sizes={vehicle.sizes}
            className={styles.carImg}
          />
          {/* Faros encendidos: capa con solo las lentes intensificadas,
              alineada píxel a píxel sobre la base */}
          <Image
            src={vehicle.lights}
            alt=""
            fill
            priority
            sizes={vehicle.sizes}
            className={styles.lightsImg}
            onAnimationEnd={() => setFlicker(false)}
          />
          {/* Haz tenue proyectado sobre el piso */}
          <span className={`${styles.beam} ${styles.beamFloor}`} />
        </div>
      </div>
    </div>
  )
}
