import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Overlay visible solo en mobile cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Header onToggleSidebar={() => setSidebarOpen(o => !o)} />
        <main className="page-container page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
