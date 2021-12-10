import yargs from 'yargs'
import {
  InvokeCommand,
  LogCommand,
  StartCommand,
  StatusCommand,
  StopCommand,
} from './commands'
import dotenv from 'dotenv'
import path from 'path'

const envDir = path.join(process.cwd(), '.env')
dotenv.config({ path: envDir })

yargs(process.argv.slice(2))
  .command(new StartCommand())
  .command(new StopCommand())
  .command(new LogCommand())
  .command(new InvokeCommand())
  .command(new StatusCommand())
  .demandCommand(1)
  .strict()
  .scriptName('subdeploy')
  .help('h')
  .alias('h', 'help').argv
