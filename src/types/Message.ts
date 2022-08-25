import { ExecBodyOptions } from './Exec'

export interface Message {
  type: string
  key?: string
  options?: ExecBodyOptions
}
