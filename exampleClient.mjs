import { offerConnection, answerConnection } from './datachannelnow.mjs'

// Signaling options can be generated dynamically to identify specific peers
function generateOptions (key) {
  return {
    peerConnectionOptions: {},
    dataChannelOptions: {},

    sendMessage: (socket, type, payload) => {
      socket.send(JSON.stringify({ type, payload, key }))
    },

    handleMessage: (event, onSuccess, onCandidate, onFailure) => {
      const data = JSON.parse(event.data)

      if (data.key !== key) return

      switch (data.type) {
        case 'SDP_OFFER': return onSuccess(data.payload)
        case 'SDP_ANSWER': return onSuccess(data.payload)
        case 'ICE_CANDIDATE': return onCandidate(data.payload)
      }
    }
  }
}

// Example of a minimal implementation for connecting peers
const socket = new WebSocket('ws://localhost:8080')
const connectButton = document.querySelector('button')

function initializeChannel (channel) {
  channel.onmessage = event => console.log(event.data)
  channel.send('Hello, World!')
}

socket.onmessage = event => {
  const data = JSON.parse(event.data)

  switch (data.type) {
    case 'CONNECTION_REQUEST':
      offerConnection(socket, generateOptions(data.key))
        .then(channel => initializeChannel(channel))
        .catch(e => console.error(e))
      break
    case 'CONNECTION_ACCEPTED':
      answerConnection(socket, generateOptions(data.key))
        .then(channel => initializeChannel(channel))
        .catch(e => console.error(e))
      break
  }
}

connectButton.onclick = event =>
  socket.send(JSON.stringify({ type: 'CONNECTION_REQUEST' }))
