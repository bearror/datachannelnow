const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })
const clients = []

wss.on('connection', function connection (ws) {
  const client = { ws, pendingConnections: [] }

  clients.push(client)

  ws.on('close', function closing () {
    const index = clients.indexOf(client)

    if (index !== -1) clients.splice(index, 1)
  })

  ws.on('message', function incoming (message) {
    const data = JSON.parse(message)

    setTimeout(() => { // simulate latency to test resilience
      switch (data.type) {
        case 'CONNECTION_REQUEST':
          const host = clients.find(host => host.ws !== ws)

          if (host) {
            const key = Math.random()

            client.pendingConnections[key] = host
            host.pendingConnections[key] = client

            client.ws.send(JSON.stringify({
              type: 'CONNECTION_ACCEPTED', key
            }))

            host.ws.send(JSON.stringify({
              type: 'CONNECTION_REQUEST', payload: data.payload, key
            }))
          }

          break

        case 'SDP_OFFER':
        case 'SDP_ANSWER':
        case 'ICE_CANDIDATE':
          const target = client.pendingConnections[data.key]

          if (target) target.ws.send(message)

          break
      }
    }, Math.random() * 2500)
  })
})
