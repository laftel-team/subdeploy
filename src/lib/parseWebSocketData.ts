import WebSocket from 'ws'
import { WebSocketData } from '../types/WebSocketData'

function parseWebSocketData(data: WebSocket.RawData) {
    return JSON.parse(data.toString()) as WebSocketData
}

export default parseWebSocketData