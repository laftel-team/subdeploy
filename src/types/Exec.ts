export type ExecQuerystring = {
  key: string
  command: string
}

export type ExecBody = {
  options: ExecBodyOptions
}

export type ExecBodyOptions = {
  branch?: string
}

export type ExecResponse = {
  status?: string
}
