import dotenv from 'dotenv'
import path from 'path'

const envDir = path.join(process.cwd(), '.env')

console.log(envDir)

dotenv.config({ path: envDir })

const { SUBDEPLOY_PORT, SUBDEPLOY_KEY, SUBDEPLOY_HOST } = process.env

if (!SUBDEPLOY_PORT || !SUBDEPLOY_KEY || !SUBDEPLOY_HOST)
  throw new Error('Missing required environment variables')

import Client from './Client'

const client = new Client({
  address: `ws://${SUBDEPLOY_HOST}:${SUBDEPLOY_PORT}/websocket`,
  key: SUBDEPLOY_KEY,
})

client.connect()
