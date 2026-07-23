'use client'

import { useState } from 'react'
import WhatsAppIcon from '../icons/WhatsAppIcon'
import { waLink, WHATSAPP_NUMBER, WHATSAPP_DISPLAY, ADDRESS, INSTAGRAM_HANDLE } from '../../lib/site'
import styles from './VehicleActions.module.css'

const RED = '#e51515'
const INK = '#212529'
const INK3 = '#9ca3af'

async function toDataURL(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('img')
  const blob = await res.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Recorta la imagen (data URL, mismo origen → canvas sin taint) a un rectángulo
// exacto de wPt×hPt puntos, tipo "cover", para que todas las fotos queden iguales.
async function coverCropJPEG(dataUrl, wPt, hPt) {
  const img = await loadImage(dataUrl)
  const cw = Math.round(wPt * 2)
  const ch = Math.round(hPt * 2)
  const scale = Math.max(cw / img.width, ch / img.height)
  const sw = cw / scale
  const sh = ch / scale
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export default function VehicleActions({ titulo, subtitulo, precio, fotos, fichaData, waMensaje, fileName }) {
  const [copiado, setCopiado] = useState(false)
  const [generando, setGenerando] = useState(false)

  async function compartir() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const data = { title: titulo, text: `${titulo} — ICY Automotores`, url }
    if (navigator.share) {
      try { await navigator.share(data) } catch { /* cancelado */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* sin permisos */ }
  }

  async function fichaPDF() {
    if (generando) return
    setGenerando(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const H = doc.internal.pageSize.getHeight()
      const M = 40
      const contentW = W - M * 2
      const footerH = 56
      let y = M

      // Logo ICY (arriba a la derecha) con su proporción real
      try {
        const logo = await toDataURL('/logo-dark.png')
        const lp = doc.getImageProperties(logo)
        const lh = 40
        const lw = lh * (lp.width / lp.height)
        doc.addImage(logo, 'PNG', W - M - lw, y, lw, lh, undefined, 'FAST')
      } catch { /* sin logo */ }

      // Título
      doc.setTextColor(INK)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text(titulo, M, y + 24)
      y += 42
      if (subtitulo) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(12)
        doc.setTextColor(INK3)
        doc.text(subtitulo, M, y)
        y += 18
      }

      // Precio
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.setTextColor(RED)
      doc.text(precio, M, y + 6)
      y += 36

      // Ficha técnica en dos columnas
      doc.setFontSize(13)
      doc.setTextColor(INK)
      doc.text('Ficha técnica', M, y)
      y += 8
      doc.setDrawColor(230)
      doc.line(M, y, W - M, y)
      y += 18

      const specColW = contentW / 2
      doc.setFontSize(11)
      fichaData.forEach(([label, valor], i) => {
        const col = i % 2
        const x = M + col * specColW
        const rowY = y + Math.floor(i / 2) * 20
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(INK3)
        doc.text(`${label}:`, x, rowY)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(INK)
        doc.text(String(valor), x + 92, rowY)
      })
      y += Math.ceil(fichaData.length / 2) * 20 + 24

      // Todas las fotos, mismo tamaño, en grilla de 2 columnas (con paginado)
      const gap = 12
      const cellW = (contentW - gap) / 2
      const cellH = cellW * 0.72
      let col = 0
      for (const url of fotos) {
        if (y + cellH > H - footerH) {
          doc.addPage()
          y = M
          col = 0
        }
        const x = M + col * (cellW + gap)
        try {
          const data = await toDataURL(url)
          const cropped = await coverCropJPEG(data, cellW, cellH)
          doc.addImage(cropped, 'JPEG', x, y, cellW, cellH, undefined, 'FAST')
        } catch { /* foto que no se pudo cargar: se omite */ }
        col++
        if (col === 2) {
          col = 0
          y += cellH + gap
        }
      }

      // Pie de contacto en cada página
      const pages = doc.getNumberOfPages()
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p)
        doc.setDrawColor(230)
        doc.line(M, H - 44, W - M, H - 44)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(INK3)
        doc.text(`ICY Automotores · WhatsApp ${WHATSAPP_DISPLAY} · ${INSTAGRAM_HANDLE}`, M, H - 30)
        doc.text(ADDRESS, M, H - 18)
      }

      doc.save(`${fileName}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className={styles.actions}>
      <a href={waLink(waMensaje)} className={styles.whatsapp}>
        <WhatsAppIcon />
        Consultar por WhatsApp
      </a>

      <a href={`tel:+${WHATSAPP_NUMBER}`} className={styles.btn}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Llamar
      </a>

      <div className={styles.row}>
        <button type="button" onClick={compartir} className={styles.btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {copiado ? 'Link copiado' : 'Compartir'}
        </button>

        <button type="button" onClick={fichaPDF} disabled={generando} className={styles.btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M12 18v-6" />
            <path d="m9 15 3 3 3-3" />
          </svg>
          {generando ? 'Generando…' : 'Ficha PDF'}
        </button>
      </div>
    </div>
  )
}
