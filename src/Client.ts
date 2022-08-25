import WebSocket from 'ws'
import fs from 'fs'
import path from 'path'
import childProcess from 'child_process'
import { log } from './log'
import { Message } from './types/Message'
import generateBufferedMessage from './lib/generateBufferedMessage'

const pwd = process.cwd()
const scriptsDir = path.resolve(pwd, './deploy-scripts')

class Client {
  private ws!: WebSocket
  private scripts: string[] = []

  private intervalId: ReturnType<typeof setInterval> | undefined

  constructor(private readonly config: { address: string; key: string }) {
    this.loadScripts()
  }

  connect() {
    this.ws = new WebSocket(this.config.address)
    this.setup()
  }

  private ping() {
    log('PING >>')
    this.ws.send(
      generateBufferedMessage({
        type: 'ping',
      })
    )
  }

  private startPingTimer() {
    this.intervalId = setInterval(() => this.ping(), 10000)
  }

  private stopPingTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  private loadScripts() {
    const scripts = fs.readdirSync(scriptsDir)
    log(`Loaded ${scripts.length} scripts: ${scripts.join(', ')}`)
    this.scripts = scripts
  }

  private setup() {
    this.ws.on('open', () => {
      this.ws.send(
        generateBufferedMessage({
          type: 'authorize',
          key: this.config.key,
        })
      )
      this.startPingTimer()
    })
    this.ws.on('message', (message) => {
      const stringified = message.toString()
      try {
        const parsed = JSON.parse(stringified) as Message
        const { type, options } = parsed
        if (type === 'ping') {
          this.ws.send(generateBufferedMessage({ type: 'pong' }))
        } else if (type === 'pong') {
          log('<< PONG')
        } else if (type === 'authorized') {
          log('Authorized successfully')
        } else if (type === 'unauthorized') {
          log('Failed to authorize')
        } else if (!this.scripts.includes(type)) {
          log(`Unknown script: ${type}`)
        } else {
          this.execScript({ type, options })
        }
      } catch (e) {
        console.error(e)
      }
    })

    // reconnect on failure
    this.ws.on('close', () => {
      log('Connection closed, reconnecting...')
      setTimeout(() => this.connect(), 1000)
      this.stopPingTimer()
    })

    this.ws.on('error', () => {
      this.ws.close()
    })
  }

  private execScript({ type, options }: Message) {
    log(`Executing script: ${type}`)
    const scriptDir = path.resolve(scriptsDir, type)
    let cmdOptions: string[] = []
    if (options) {
      const { branch } = options
      if (branch) {
        cmdOptions.push('--branch')
        cmdOptions.push(branch)
      }
    }
    const child = childProcess.spawn(scriptDir, cmdOptions)
    child.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    child.stderr.on('data', (data) => {
      console.log(data.toString())
    })

    child.on('exit', (code) => {
      if (code === 0) {
        log(`Successfully executed script: ${type}`)
        return
      }
      log(`Script ${type} failed`)
    })
  }
}

export default Client
