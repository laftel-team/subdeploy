#!/usr/bin/env node

import yargs from 'yargs'
import {
  InvokeCommand,
  LogCommand,
  StartCommand,
  StatusCommand,
  StopCommand,
  RestartCommand,
  ExecCommand,
} from './commands'
import dotenv from 'dotenv'
import path from 'path'

const envDir = path.join(process.cwd(), '.env')
dotenv.config({ path: envDir })

yargs(process.argv.slice(2))
  .command(new StartCommand())
  .command(new StopCommand())
  .command(new RestartCommand())
  .command(new LogCommand())
  .command(new InvokeCommand())
  .command(new ExecCommand())
  .command(new StatusCommand())
  .demandCommand(1)
  .strict()
  .scriptName('subdeploy')
  .help('h')
  .alias('h', 'help').argv
