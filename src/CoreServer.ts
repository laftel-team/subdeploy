import Fastify from 'fastify'
import fastifyWebsocket from 'fastify-websocket'
import { WebSocket } from 'ws'
import generateWebSocketData from './lib/generateWebSocketData'
import parseWebSocketData from './lib/parseWebSocketData'
import { log } from './log'

type CoreServerConfig = {
  port: number
  key: string
}

type ExecQuerystring = {
  key: string
  command: string
  targetBranch?: string
}

class CoreServer {
  app = Fastify()

  sockets = new Set<WebSocket>()

  broadcast(data: { command: string, targetBranch?: string }) {
    this.sockets.forEach((socket) => {
      socket.send(generateWebSocketData(data))
    })
  }

  setupRoutes() {
    this.app.post<{ Querystring: ExecQuerystring }>(
      '/exec',
      async (request, reply) => {
        const { key, command, targetBranch } = request.query
        if (key !== this.config.key) {
          reply.code(401)
          throw new Error('Invalid key')
        }

        log(`Broadcast command: ${command}`)
        if (targetBranch) {
          log(`Target branch: ${targetBranch}`)
        }

        this.broadcast({ command, targetBranch })

        return {
          status: 'ok',
        }
      }
    )

    this.app.get('/websocket', { websocket: true }, (connection, req) => {
      this.sockets.add(connection.socket)
      connection.socket.on('message', (data) => {
        const { command } = parseWebSocketData(data)
        if (command === 'ping') {
          log(`${req.ip} >> PING`)
          connection.socket.send(generateWebSocketData({
            command: 'pong'
          }))
          log(`PONG >> ${req.ip}`)
        } else if (command.startsWith('authorize/')) {
          const key = command.split('/')[1]
          if (key === this.config.key) {
            log(`${req.ip} is authorized`)
            connection.socket.send(generateWebSocketData({
              command: 'authorized'
            }))
            this.sockets.add(connection.socket)
          } else {
            connection.socket.send(generateWebSocketData({
              command: 'unauthorized'
            }))
          }
        }
      })
      connection.socket.on('close', () => {
        this.sockets.delete(connection.socket)
        log(`${req.ip} is disconnected`)
      })
    })
  }

  setupPlugins() {
    this.app.register(fastifyWebsocket)
  }

  constructor(readonly config: CoreServerConfig) {
    this.setupPlugins()
    this.setupRoutes()
  }

  async start() {
    try {
      await this.app.listen(this.config.port, '0.0.0.0')
      log(`Server listening on ${this.config.port}`)
    } catch (e: any) {
      console.error(e)
      process.exit(1)
    }
  }
}

export default CoreServer
