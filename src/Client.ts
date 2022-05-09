import WebSocket from 'ws'
import fs from 'fs'
import path from 'path'
import childProcess from 'child_process'
import { log } from './log'

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
    this.ws.send('ping')
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
      this.ws.send(`authorize/${this.config.key}`)
      this.startPingTimer()
    })
    this.ws.on('message', (data) => {
      const parsed = data.toString()

      if (parsed === 'ping') {
        this.ws.send('pong')
      } else if (parsed === 'pong') {
        log('<< PONG')
      } else if (parsed === 'authorized') {
        log('Authorized successfully')
      } else if (parsed === 'unauthorized') {
        log('Failed to authorize')
      } else if (!this.scripts.includes(parsed)) {
        log(`Unknown script: ${parsed}`)
      } else {
        this.execScript(parsed)
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

  private execScript(script: string) {
    log(`Executing script: ${script}`)
    const scriptDir = path.resolve(scriptsDir, script)
    const child = childProcess.spawn(scriptDir)
    child.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    child.stderr.on('data', (data) => {
      console.log(data.toString())
    })

    child.on('exit', (code) => {
      if (code === 0) {
        log(`Successfully executed script: ${script}`)
        return
      }
      log(`Script ${script} failed`)
    })
  }
}

export default Client
