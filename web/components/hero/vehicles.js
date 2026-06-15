// Vehículos del hero. Cada uno trae su par de imágenes (base + faros) y el
// tuning visual que depende de su silueta: el marco (ancho/aspect), el pivote
// del cabeceo (su eje delantero) y la posición del haz sobre el piso.
//
// El titular concuerda en género: "Tu próximo auto" / "Tu próxima moto".
// El hero cicla entre vehículos cada 5s en el cliente (ver Hero.jsx): la
// imagen y el titular cambian juntos con un fundido. El orden de rotación es
// el de VEHICLE_KEYS.

export const VEHICLES = {
  auto: {
    lead: 'Tu próximo auto',
    base: '/hero-car.webp',
    lights: '/hero-car-lights.webp',
    sizes: '(max-width: 900px) 92vw, 620px',
    frame: { maxWidth: 620, ratio: '1474 / 857', pivot: '28% 78%' },
    beam: { left: '4%', top: '80%', width: '72%', height: '45%' },
  },
  moto: {
    lead: 'Tu próxima moto',
    base: '/hero-moto.webp',
    lights: '/hero-moto-lights.webp',
    sizes: '(max-width: 900px) 72vw, 470px',
    frame: { maxWidth: 470, ratio: '595 / 507', pivot: '16% 84%' },
    beam: { left: '-4%', top: '84%', width: '54%', height: '38%' },
  },
  // camioneta: pendiente de imagen frente-3/4 (faros mirando al espectador).
}

export const VEHICLE_KEYS = Object.keys(VEHICLES)
