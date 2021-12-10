import Fastify from 'fastify'
import fastifyWebsocket from 'fastify-websocket'
import { WebSocket } from 'ws'
import { log } from './log'

type CoreServerConfig = {
  port: number
  key: string
}

type ExecQuerystring = {
  key: string
  command: string
}

class CoreServer {
  app = Fastify()

  sockets = new Set<WebSocket>()

  broadcast(message: string) {
    this.sockets.forEach((socket) => {
      socket.send(message)
    })
  }

  setupRoutes() {
    this.app.post<{ Querystring: ExecQuerystring }>(
      '/exec',
      async (request, reply) => {
        if (request.query.key !== this.config.key) {
          reply.code(401)
          throw new Error('Invalid key')
        }

        log(`Broadcast command: ${request.query.command}`)

        this.broadcast(request.query.command)

        return {
          status: 'ok',
        }
      }
    )

    this.app.get('/websocket', { websocket: true }, (connection, req) => {
      this.sockets.add(connection.socket)
      connection.socket.on('message', (message) => {
        const parsed = message.toString()
        if (parsed === 'ping') {
          connection.socket.send('pong')
        } else if (parsed.startsWith('authorize/')) {
          const key = parsed.split('/')[1]
          if (key === this.config.key) {
            log(`${req.ip} is authorized`)
            connection.socket.send('authorized')
            this.sockets.add(connection.socket)
          } else {
            connection.socket.send('unauthorized')
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
