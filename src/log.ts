export function log(text: string) {
  console.log(`\x1b[2m[${new Date().toISOString()}]\x1b[0m ${text}`)
}
