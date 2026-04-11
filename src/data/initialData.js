// ===================================================================
// DATOS INICIALES DE LA APLICACIÓN
// Se cargan la primera vez en localStorage y sirven como demo
// ===================================================================

export const INITIAL_USERS = [
  {
    id: 'u1',
    nombre: 'Carlos Gerente',
    username: 'gerente',
    password: '1234',
    rol: 'gerente',
    comision: 0,
    createdAt: '2024-01-01',
  },
  {
    id: 'u2',
    nombre: 'Martina López',
    username: 'martina',
    password: '1234',
    rol: 'empleado',
    comision: 3,
    createdAt: '2024-01-15',
  },
  {
    id: 'u3',
    nombre: 'Rodrigo Sánchez',
    username: 'rodrigo',
    password: '1234',
    rol: 'empleado',
    comision: 3.5,
    createdAt: '2024-02-01',
  },
]

export const INITIAL_AUTOS = [
  {
    id: 'a1',
    marca: 'Toyota',
    modelo: 'Corolla',
    año: 2022,
    precioCompra: 18000000,
    precioVenta: 22500000,
    kilometraje: 15000,
    estado: 'disponible',
    foto: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&q=80',
    descripcion: 'Toyota Corolla 2022, único dueño, full equipo, excelente estado.',
    createdAt: '2024-01-10',
  },
  {
    id: 'a2',
    marca: 'Ford',
    modelo: 'Ranger XLT',
    año: 2021,
    precioCompra: 25000000,
    precioVenta: 31000000,
    kilometraje: 40000,
    estado: 'disponible',
    foto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    descripcion: 'Ford Ranger XLT 2021, 4x4, caja automática, service al día.',
    createdAt: '2024-01-20',
  },
  {
    id: 'a3',
    marca: 'Volkswagen',
    modelo: 'Golf GTI',
    año: 2023,
    precioCompra: 28000000,
    precioVenta: 34500000,
    kilometraje: 5000,
    estado: 'vendido',
    foto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
    descripcion: 'VW Golf GTI 2023, cuero, techo panorámico, como 0km.',
    createdAt: '2024-02-05',
  },
  {
    id: 'a4',
    marca: 'Chevrolet',
    modelo: 'Tracker LTZ',
    año: 2022,
    precioCompra: 20000000,
    precioVenta: 25800000,
    kilometraje: 22000,
    estado: 'disponible',
    foto: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=400&q=80',
    descripcion: 'Chevrolet Tracker LTZ 2022, automática, full opciones.',
    createdAt: '2024-02-15',
  },
  {
    id: 'a5',
    marca: 'Honda',
    modelo: 'HR-V EX',
    año: 2021,
    precioCompra: 17500000,
    precioVenta: 21900000,
    kilometraje: 35000,
    estado: 'disponible',
    foto: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80',
    descripcion: 'Honda HR-V EX 2021, automática, cámara 360, muy cuidado.',
    createdAt: '2024-03-01',
  },
]

export const INITIAL_CLIENTES = [
  {
    id: 'c1',
    nombre: 'Ana García',
    telefono: '+54 11 4567-8901',
    email: 'ana.garcia@email.com',
    dni: '28.456.789',
    createdAt: '2024-01-25',
  },
  {
    id: 'c2',
    nombre: 'Luis Martínez',
    telefono: '+54 11 5678-9012',
    email: 'luis.martinez@email.com',
    dni: '32.123.456',
    createdAt: '2024-02-10',
  },
  {
    id: 'c3',
    nombre: 'Sofía Torres',
    telefono: '+54 11 6789-0123',
    email: 'sofia.torres@email.com',
    dni: '35.789.012',
    createdAt: '2024-03-05',
  },
]

export const INITIAL_VENTAS = [
  {
    id: 'v1',
    autoId: 'a3',
    clienteId: 'c1',
    vendedorId: 'u2',
    tipoPago: 'financiado',
    cuotas: 24,
    precioFinal: 34500000,
    ganancia: 6500000,
    comisionVendedor: 1035000,
    fecha: '2024-03-15',
    createdAt: '2024-03-15',
  },
]

export const INITIAL_EGRESOS = [
  {
    id: 'e1',
    tipo: 'operativo',
    descripcion: 'Alquiler sucursal',
    monto: 850000,
    fecha: '2024-03-01',
    createdAt: '2024-03-01',
  },
  {
    id: 'e2',
    tipo: 'varios',
    descripcion: 'Insumos de cafetería y limpieza',
    monto: 35000,
    fecha: '2024-03-10',
    createdAt: '2024-03-10',
  },
]

// Configuraciones globales
export const INITIAL_CONFIG = {
  comisionDefault: 3, // porcentaje por defecto para nuevos empleados
}
