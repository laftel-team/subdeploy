import CoreServer from './CoreServer'
import dotenv from 'dotenv'
import path from 'path'

const envDir = path.join(process.cwd(), '.env')
dotenv.config({ path: envDir })

const { SUBDEPLOY_PORT, SUBDEPLOY_KEY } = process.env

if (!SUBDEPLOY_PORT || !SUBDEPLOY_KEY)
  throw new Error('Missing required environment variables')

const coreServer = new CoreServer({
  key: SUBDEPLOY_KEY,
  port: parseInt(SUBDEPLOY_PORT, 10),
})

coreServer.start()
