import pm2 from 'pm2'
import yargs from 'yargs'
import path from 'path'

export class StartCommand implements yargs.CommandModule {
  command = 'start <instance>'
  describe = 'Starts the instance'

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
      .example('$0 start core', 'Stops the core instance')
      .example('$0 start client', 'Stops the client instance')
  }

  handler(args: yargs.Arguments) {
    const instance = args.instance as string
    pm2.connect((err) => {
      if (err) {
        console.error(err)
        process.exit(2)
      }
      pm2.delete(`subdeploy-${instance}`, (err) => {
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
        choices: ['core', 'server'],
        describe: 'Instance type to stop',
        type: 'string',
      })
      .example('$0 log core', 'Print the logs of the core instance')
      .example('$0 log client', 'Print the logs of the client instance')
  }

  handler(args: yargs.Arguments) {}
}

export class InvokeCommand implements yargs.CommandModule {
  command = 'invoke <script>'
  describe = 'Invokes the clients to run specific script'

  builder(args: yargs.Argv) {
    return args
      .positional('script', {
        describe:
          'The name of the script to run, the script file must exist in deploy-scripts directory',
        type: 'string',
      })
      .example('$0 invoke update', 'Invokes the update script')
  }

  handler(args: yargs.Arguments) {}
}
