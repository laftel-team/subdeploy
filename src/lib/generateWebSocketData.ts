import { WebSocketData } from '../types/WebSocketData'

function generateWebSocketData(payload: WebSocketData) {
    return JSON.stringify(payload)
}

export default generateWebSocketData
