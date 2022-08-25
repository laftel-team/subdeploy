import { Message } from '../types/Message'

function generateBufferedMessage(message: Message) {
  return Buffer.from(JSON.stringify(message))
}

export default generateBufferedMessage
