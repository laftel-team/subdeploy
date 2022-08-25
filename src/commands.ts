import pm2 from 'pm2'
import yargs from 'yargs'
import path from 'path'
import childProcess from 'child_process'
import { getBorderCharacters, table } from 'table'
import axios, { AxiosResponse } from 'axios'
import { ExecBody, ExecQuerystring, ExecResponse } from './types/Exec'

export class StartCommand implements yargs.CommandModule {
  command = 'start <instance>'
  describe =
    'Starts the instance. If the instance is already running, it will be restarted.'

  builder(args: yargs.Argv) {
    return args
      .positional('instance', {
        choices: ['core', 'client'],
        describe: 'Instance type to start',
        type: 'string',
      })
      .example('$0 start core', 'Starts the core instance')
      .example('$0 start client', 'Starts the client instance')
  }

  handler(args: yargs.Arguments) {
    const instance = args.instance as string
    pm2.connect((err) => {
      if (err) {
        console.error(err)
        process.exit(2)
      }

      pm2.start(
        {
          script: path.resolve(__dirname, `./index.${instance}.js`),
          name: `subdeploy-${instance}`,
        },
        (err, apps) => {
          if (err) {
            console.error(err)
            return pm2.disconnect()
          }
          pm2.disconnect()
        }
      )
    })
  }
}

export class StopCommand implements yargs.CommandModule {
  command = 'stop <instance>'
  describe = 'Stops the instance'

  builder(args: yargs.Argv) {
    return args
      .positional('instance', {
        choices: ['core', 'client'],
        describe: 'Instance type to stop',
        type: 'string',
      })
      .example('$0 stop core', 'Stops the core instance')
      .example('$0 stop client', 'Stops the client instance')
  }

  handler(args: yargs.Arguments) {
    const instance = args.instance as string
    pm2.connect((err) => {
      if (err) {
        console.error(err)
        process.exit(2)
      }
      pm2.stop(`subdeploy-${instance}`, (err) => {
        if (err) {
          console.error(err)
        }
        pm2.disconnect()
      })
    })
  }
}

export class RestartCommand implements yargs.CommandModule {
  command = 'restart <instance>'
  describe = 'Restarts the instance'

  builder(args: yargs.Argv) {
    return args
      .positional('instance', {
        choices: ['core', 'client'],
        describe: 'Instance type to stop',
        type: 'string',
      })
      .example('$0 stop core', 'Restarts the core instance')
      .example('$0 stop client', 'Restarts the client instance')
  }

  handler(args: yargs.Arguments) {
    const instance = args.instance as string
    pm2.connect((err) => {
      if (err) {
        console.error(err)
        process.exit(2)
      }
      pm2.restart(`subdeploy-${instance}`, (err) => {
        if (err) {
          console.error(err)
        }
        pm2.disconnect()
      })
    })
  }
}

export class LogCommand implements yargs.CommandModule {
  command = 'log <instance>'
  describe = 'Prints the log of the instance'

  builder(args: yargs.Argv) {
    return args
      .positional('instance', {
        choices: ['core', 'client'],
        describe: 'Instance type to stop',
        type: 'string',
      })
      .example('$0 log core', 'Print the logs of the core instance')
      .example('$0 log client', 'Print the logs of the client instance')
  }

  handler(args: yargs.Arguments) {
    const instance = args.instance as string
    pm2.connect((err) => {
      pm2.list((err, list) => {
        const selectedItem = list.find(
          (item) => item.name === `subdeploy-${instance}`
        )

        const logFile = selectedItem?.pm2_env?.pm_out_log_path

        if (!logFile) {
          console.error(`Could not find log of the ${instance} instance.`)
          return pm2.disconnect()
        }

        console.log(`\x1b[2m${logFile}\x1b[0m`)
        childProcess.spawn('tail', ['-f', logFile], {
          detached: false,
          stdio: 'inherit',
        })

        pm2.disconnect()
      })
    })
  }
}

export class StatusCommand implements yargs.CommandModule {
  command = 'status'
  describe = 'Checks the status of the instances'

  handler(args: yargs.Arguments) {
    pm2.connect((err) => {
      pm2.list((err, list) => {
        const data: { type: string; status: string }[] = []
        const core = list.find((item) => item.name === 'subdeploy-core')
        const client = list.find((item) => item.name === 'subdeploy-client')

        ;[core, client].forEach((item, i) => {
          data.push({
            type: i === 0 ? 'core' : 'client',
            status:
              item?.pm2_env?.status === 'online'
                ? '\x1b[32monline\x1b[0m'
                : '\x1b[31moffline\x1b[0m',
          })
        })
        const rows = [['\x1b[36mtype\x1b[0m', '\x1b[36mstatus\x1b[0m']].concat(
          data.map((item) => [item.type, item.status])
        )

        console.log(
          table(rows, {
            border: getBorderCharacters('norc'),
          })
        )

        pm2.disconnect()
      })
    })
  }
}

export class InvokeCommand implements yargs.CommandModule {
  command = 'invoke <script>'
  describe = 'Invokes the clients to run specific script'

  builder(args: yargs.Argv) {
    return args
      .option('b', {
        alias: 'branch',
        type: 'string',
        describe: 'The specific branch name to provide by option',
        demandOption: false,
      })
      .positional('script', {
        describe:
          'The name of the script to run, the script file must exist in deploy-scripts directory',
        type: 'string',
      })
      .example('$0 invoke update', 'Invokes the update script')
  }

  async handler(args: yargs.Arguments) {
    const { SUBDEPLOY_PORT, SUBDEPLOY_HOST, SUBDEPLOY_KEY } = process.env
    const script = args.script as string
    const branch = args.branch as string | undefined
    const url = `http://${SUBDEPLOY_HOST}:${SUBDEPLOY_PORT}/exec`
    try {
      const { data } = await axios.post<
        ExecResponse,
        AxiosResponse<ExecResponse>,
        ExecBody
      >(
        url,
        {
          options: {
            branch,
          },
        },
        {
          params: { key: SUBDEPLOY_KEY, command: script } as ExecQuerystring,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      console.log(data)
    } catch (e) {
      if (axios.isAxiosError(e)) {
        console.error(e.response?.data)
      }
    }
  }
}
