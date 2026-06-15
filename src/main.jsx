import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { initAnimatedFavicon } from './lib/animatedFavicon.js'

registerSW({ immediate: true })

// Favicon animado: brillo sutil sobre el logo existente (icon-32 sobre fondo oscuro).
initAnimatedFavicon({ src: '/icons/icon-32.png', size: 32 })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
