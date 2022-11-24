const express = require('express')
const uuid = require('uuid')
const path = require('path')
const { createServer } = require('http')
const { WebSocket, WebSocketServer } = require('ws')

const app = express()
app.use(express.static('public'))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})
const mp = new Map()
const idxMp = new Map() //{uid: idx}
const users = Array(100).fill("")

const server = createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', function(ws, req) {
    const userId = uuid.v4() //一连接就自动login，马上分配id
    mp.set(userId, ws)
    console.log(`${userId.substring(0, 5)} connected`)
    ws.send(JSON.stringify(users)) //为新加入用户初始化data
    ws.on('message', (msg) => {
        console.log(`Received message ${msg} from user ${userId.substring(0, 5)} ${Date.now()}`)
        const [idx, uname] = `${msg}`.split('-')
        idxMp.set(userId, idx)
        console.log(idxMp)
        users[idx] = uname
        wss.clients.forEach(client => { //广播
            if (client.readyState == WebSocket.OPEN) {
                client.send(`${msg}-join`)
            }
        })
    })

    ws.on('close', () => {
        console.log(`${userId.substring(0, 5)} disconnected`)
        mp.delete(userId)
        const userIdx = idxMp.get(userId)
        idxMp.delete(userId)
        if (userIdx) {
            users[userIdx] = ''
            wss.clients.forEach(client => {
                if (client != ws && client.readyState == WebSocket.OPEN) {
                    client.send(`${userIdx}--leave`)
                }
            })
        }
    })

})

const PORT = process.env.PORT || 3000
server.listen(PORT, function() {
    console.log(`Listening on ${PORT}`)
})