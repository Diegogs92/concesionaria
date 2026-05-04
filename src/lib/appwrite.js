import { Client, Databases, ID, Query } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('69f904f5001b94aab5a2')

export const databases = new Databases(client)
export { ID, Query }

export const DB_ID = '69f906490000ea7f74fd'

export const COL = {
  AUTOS:            'autos',
  CLIENTES:         'clientes',
  VENTAS:           'ventas',
  EGRESOS:          'egresos',
  TEST_DRIVES:      'testDrives',
  HISTORIAL:        'historialPrecios',
  USUARIOS:         'usuarios',
}
