# ▶ datachannelnow

Offer and answer WebRTC DataChannels as a single promise. DataChannelNow makes no assumptions about the rest of the system — but it does make sure to clean after itself.

## Example

```js
import { offerConnection, answerConnection } from 'datachannelnow'

const socket = new WebSocket(/* SOCKET_SERVER_ADDRESS */)
const options = {
  peerConnectionOptions: { /* RTCConfiguration */ },
  dataChannelOptions: { /* RTCDataChannelInit */ },
  sendMessage: (socket, type, payload) => {
  	// Send signaling messages for THIS SPECIFIC connection
    // type = 'SDP_OFFER' || 'SDP_ANSWER' || 'ICE_CANDIDATE'
  },
  handleMessage: (event, onSuccess, onCandidate, onFailure) => {
  	// Handle signaling messages for THIS SPECIFIC connection
  }
}

offerConnection(socket, options).then(channel => { /* Marco */ })
answerConnection(socket, options).then(channel => { /* Polo! */ })
```
> A basic implementation can be found in this repository for both `exampleClient` and `exampleServer`, although DataChannelNow has nothing to do with the server-side!

## Usage

### Add datachannelnow to your project

Install it with npm:
```bash
npm install --save datachannelnow
```

Import the module:
```js
import { offerConnection, answerConnection } from 'datachannelnow'
```

### Wire it up to the rest of your system

Plug datachannelnow in to your signaling system with the `options` object:
```js
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
```

Offer and answer connections according to your connection strategy:
```js
socket.onmessage = event => {
  const data = JSON.parse(event.data)

  switch (data.type) {
    case 'CONNECTION_REQUESTED':
      offerConnection(socket, generateOptions(data.key))
        .then(channel => { /* Marco */ })
      break
    case 'CONNECTION_ACCEPTED':
      answerConnection(socket, generateOptions(data.key))
        .then(channel => { /* Polo! */ })
      break
  }
}
```

## API

### `offerConnection(socket, options)`

### `answerConnection(socket, options)`

---

### `options = { peerConnectionOptions, dataChannelOptions, sendMessage, handleMessage }`
The `options` object passes in both the *WebRTC configurations* and the *signaling implementations*. `peerConnectionOptions` is [RTCConfiguration dictionary](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#RTCConfiguration_dictionary), and `dataChannelOptions` is an [RTCDataChannelInit dictionary](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel#RTCDataChannelInit_dictionary).

#### `sendMessage: (socket, type, payload) => {}`
The passed in `type` is one of the following strings `'SDP_OFFER'` `'SDP_ANSWER'` `'ICE_CANDIDATE'`, and the `payload` is the corresponding signaling data to be passed to the other peer.

#### `handleMessage: (event, onSuccess, onCandidate, onFailure) => {}`
The `onSuccess` and `onCandidate` functions should be called with the `payload` when a valid message has been received. `onFailure` can be called to cancel the signaling process with a custom error.

## Author

Joonatan Vuorinen ([@bearror](https://twitter.com/bearror))
