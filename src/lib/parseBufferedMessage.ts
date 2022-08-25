import { RawData } from 'ws'
import { Message } from '../types/Message'

function parseBufferedMessage(message: RawData): Message {
  const stringified = message.toString()
  try {
    const parsed = JSON.parse(stringified) as Message
    return parsed
  } catch (e) {
    throw Error(e as any)
  }
}

export default parseBufferedMessage
