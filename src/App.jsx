import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppProvider } from './context/AppContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import DashboardPage from './pages/DashboardPage'
import AutosPage from './pages/AutosPage'
import ClientesPage from './pages/ClientesPage'
import VentasPage from './pages/VentasPage'
import FinanzasPage from './pages/FinanzasPage'
import EmpleadosPage from './pages/EmpleadosPage'

// ─── Ruta protegida: redirige al login si no hay sesión ──────────────────────
function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

// ─── Ruta solo para gerentes ─────────────────────────────────────────────────
function GerenteRoute({ children }) {
  const { currentUser, isGerente } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (!isGerente)   return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

// ─── Rutas públicas: redirige al dashboard si ya está logueado ───────────────
function PublicRoute({ children }) {
  const { currentUser } = useAuth()
  if (currentUser) return <Navigate to="/" replace />
  return children
}

// ─── App con todos los providers ─────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* Login */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Dashboard — ambos roles */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <DashboardPage />
                  </PrivateRoute>
                }
              />

              {/* Autos — ambos roles */}
              <Route
                path="/autos"
                element={
                  <PrivateRoute>
                    <AutosPage />
                  </PrivateRoute>
                }
              />

              {/* Clientes — ambos roles */}
              <Route
                path="/clientes"
                element={
                  <PrivateRoute>
                    <ClientesPage />
                  </PrivateRoute>
                }
              />

              {/* Ventas — ambos roles */}
              <Route
                path="/ventas"
                element={
                  <PrivateRoute>
                    <VentasPage />
                  </PrivateRoute>
                }
              />

              {/* Finanzas — solo gerente */}
              <Route
                path="/finanzas"
                element={
                  <GerenteRoute>
                    <FinanzasPage />
                  </GerenteRoute>
                }
              />

              {/* Empleados — solo gerente */}
              <Route
                path="/empleados"
                element={
                  <GerenteRoute>
                    <EmpleadosPage />
                  </GerenteRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
