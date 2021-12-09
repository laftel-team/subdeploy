import yargs from 'yargs'
import {
  InvokeCommand,
  LogCommand,
  StartCommand,
  StopCommand,
} from './commands'

yargs(process.argv.slice(2))
  .command(new StartCommand())
  .command(new StopCommand())
  .command(new LogCommand())
  .command(new InvokeCommand())
  .demandCommand(1)
  .strict()
  .scriptName('subdeploy')
  .help('h')
  .alias('h', 'help').argv
