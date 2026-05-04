import { Client, Databases, Permission, Role } from 'node-appwrite'

const API_KEY    = 'standard_f791cf84faaab39d03f2b01222052f9ffd1d2bf18f5db51a3740e3eba1ac594557cd38190dfe1060e68106aa206c61c7a47982f71d644af4d9c66e5f07811f9c55653322dd31f6a2ab6d256509eb386a0dd7589187fafbc14a2dcf561dd8273411d0bf0b6ca10246e43b2c6e9f7d715b7f967932c998e7e83a7e9f5e3b8dca8a'
const PROJECT_ID = '69f904f5001b94aab5a2'
const DATABASE_ID = '69f906490000ea7f74fd'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const db = new Databases(client)

const PERMS = [Permission.read(Role.any()), Permission.write(Role.any())]

async function crearColeccion(colId, colNombre, atributos) {
  try {
    await db.createCollection(DATABASE_ID, colId, colNombre, PERMS)
    console.log(`✓ Colección creada: ${colNombre}`)
  } catch (e) {
    if (e.code === 409) {
      console.log(`⚠ Colección ya existe: ${colNombre}`)
    } else {
      throw e
    }
  }

  for (const attr of atributos) {
    try {
      if (attr.type === 'string') {
        await db.createStringAttribute(DATABASE_ID, colId, attr.key, attr.size || 512, attr.required ?? false)
      } else if (attr.type === 'integer') {
        await db.createIntegerAttribute(DATABASE_ID, colId, attr.key, attr.required ?? false)
      } else if (attr.type === 'float') {
        await db.createFloatAttribute(DATABASE_ID, colId, attr.key, attr.required ?? false)
      } else if (attr.type === 'boolean') {
        await db.createBooleanAttribute(DATABASE_ID, colId, attr.key, attr.required ?? false)
      }
      // Pequeña pausa para evitar rate limiting
      await new Promise(r => setTimeout(r, 300))
      console.log(`  ✓ Atributo: ${attr.key}`)
    } catch (e) {
      if (e.code === 409) {
        console.log(`  ⚠ Atributo ya existe: ${attr.key}`)
      } else {
        console.error(`  ✗ Error en ${attr.key}:`, e.message)
      }
    }
  }
}

async function setup() {
  console.log('🚀 Configurando colecciones en Appwrite...\n')

  await crearColeccion('autos', 'Autos', [
    { key: 'marca',        type: 'string',  size: 100 },
    { key: 'modelo',       type: 'string',  size: 100 },
    { key: 'anio',         type: 'integer' },
    { key: 'precioCompra', type: 'integer' },
    { key: 'precioVenta',  type: 'integer' },
    { key: 'kilometraje',  type: 'integer' },
    { key: 'estado',       type: 'string',  size: 50 },
    { key: 'foto',         type: 'string',  size: 1000 },
    { key: 'descripcion',  type: 'string',  size: 2000 },
    { key: 'createdAt',    type: 'string',  size: 50 },
  ])

  await crearColeccion('clientes', 'Clientes', [
    { key: 'nombre',    type: 'string', size: 200 },
    { key: 'telefono',  type: 'string', size: 100 },
    { key: 'email',     type: 'string', size: 200 },
    { key: 'dni',       type: 'string', size: 50  },
    { key: 'createdAt', type: 'string', size: 50  },
  ])

  await crearColeccion('ventas', 'Ventas', [
    { key: 'autoId',           type: 'string',  size: 50  },
    { key: 'clienteId',        type: 'string',  size: 50  },
    { key: 'vendedorId',       type: 'string',  size: 50  },
    { key: 'tipoPago',         type: 'string',  size: 50  },
    { key: 'cuotas',           type: 'integer' },
    { key: 'precioFinal',      type: 'integer' },
    { key: 'ganancia',         type: 'integer' },
    { key: 'comisionVendedor', type: 'integer' },
    { key: 'fecha',            type: 'string',  size: 50  },
    { key: 'createdAt',        type: 'string',  size: 50  },
  ])

  await crearColeccion('egresos', 'Egresos', [
    { key: 'tipo',        type: 'string', size: 100  },
    { key: 'descripcion', type: 'string', size: 1000 },
    { key: 'monto',       type: 'integer' },
    { key: 'fecha',       type: 'string', size: 50   },
    { key: 'createdAt',   type: 'string', size: 50   },
  ])

  await crearColeccion('testDrives', 'Test Drives', [
    { key: 'autoId',     type: 'string', size: 50   },
    { key: 'clienteId',  type: 'string', size: 50   },
    { key: 'vendedorId', type: 'string', size: 50   },
    { key: 'fecha',      type: 'string', size: 50   },
    { key: 'horario',    type: 'string', size: 50   },
    { key: 'estado',     type: 'string', size: 50   },
    { key: 'notas',      type: 'string', size: 2000 },
    { key: 'createdAt',  type: 'string', size: 50   },
  ])

  await crearColeccion('historialPrecios', 'Historial de Precios', [
    { key: 'autoId',        type: 'string',  size: 50 },
    { key: 'campo',         type: 'string',  size: 50 },
    { key: 'valorAnterior', type: 'integer' },
    { key: 'valorNuevo',    type: 'integer' },
    { key: 'fecha',         type: 'string',  size: 50 },
    { key: 'createdAt',     type: 'string',  size: 50 },
  ])

  await crearColeccion('usuarios', 'Usuarios', [
    { key: 'nombre',    type: 'string', size: 200 },
    { key: 'username',  type: 'string', size: 100 },
    { key: 'password',  type: 'string', size: 200 },
    { key: 'rol',       type: 'string', size: 50  },
    { key: 'comision',  type: 'float'  },
    { key: 'createdAt', type: 'string', size: 50  },
  ])

  console.log('\n✅ Setup completado.')
}

setup().catch(console.error)
