import Fastify from 'fastify'
import fastifyWebsocket from 'fastify-websocket'
import { WebSocket } from 'ws'
import generateBufferedMessage from './lib/generateBufferedMessage'
import { log } from './log'
import { ExecBody, ExecQuerystring } from './types/Exec'
import { Message } from './types/Message'

type CoreServerConfig = {
  port: number
  key: string
}

class CoreServer {
  app = Fastify()

  sockets = new Set<WebSocket>()

  broadcast(message: Message) {
    this.sockets.forEach((socket) => {
      socket.send(generateBufferedMessage(message))
    })
  }

  setupRoutes() {
    this.app.post<{
      Querystring: ExecQuerystring
      Body: ExecBody
    }>('/exec', async (request, reply) => {
      const { key, command } = request.query
      const { options } = request.body
      if (key !== this.config.key) {
        reply.code(401)
        throw new Error('Invalid key')
      }

      log(`Broadcast command: ${command}, options: ${JSON.stringify(options)}`)

      this.broadcast({
        type: command,
        options,
      })

      return {
        status: 'ok',
      }
    })

    this.app.get('/websocket', { websocket: true }, (connection, req) => {
      this.sockets.add(connection.socket)
      connection.socket.on('message', (message) => {
        const stringified = message.toString()

        try {
          const parsed = JSON.parse(stringified) as Message
          const { type, key } = parsed
          if (type === 'ping') {
            log(`${req.ip} >> PING`)
            connection.socket.send(generateBufferedMessage({ type: 'pong' }))
            log(`PONG >> ${req.ip}`)
          } else if (type === 'authorize') {
            if (key === this.config.key) {
              log(`${req.ip} is authorized`)
              connection.socket.send(
                generateBufferedMessage({ type: 'authorized' })
              )
              this.sockets.add(connection.socket)
            } else {
              connection.socket.send(
                generateBufferedMessage({ type: 'unauthorized' })
              )
            }
          }
        } catch (e) {
          console.error(e)
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
