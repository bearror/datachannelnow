function removeHandlers (socket, connection, messageListener, closeListener) {
  socket.removeEventListener('message', messageListener)
  socket.removeEventListener('close', closeListener)

  connection.onnegotiationneeded = undefined
  connection.onicecandidate = undefined
  connection.onconnectionstatechange = undefined
  connection.ondatachannel = undefined
}

export function offerConnection (socket,
  { peerConnectionOptions, dataChannelOptions, sendMessage, handleMessage }) {
  return new Promise((resolve, reject) => {
    const connection = new RTCPeerConnection(peerConnectionOptions)
    const channel = connection.createDataChannel(dataChannelOptions)

    function messageListener (event) {
      handleMessage(event,
        description => connection.setRemoteDescription(description),
        candidate => connection.addIceCandidate(candidate),
        reason => {
          removeHandlers(socket, connection, messageListener, closeListener)
          reject(reason)
        }
      )
    }

    function closeListener (event) {
      removeHandlers(socket, connection, messageListener, closeListener)
      reject(new Error('Socket closed'))
    }

    socket.addEventListener('message', messageListener)
    socket.addEventListener('close', closeListener)

    connection.onnegotiationneeded = event => {
      connection.createOffer()
        .then(localDescription => {
          connection.setLocalDescription(localDescription)

          sendMessage(socket, 'SDP_OFFER', localDescription)
        })
    }

    connection.onicecandidate = event => {
      if (event.candidate) {
        sendMessage(socket, 'ICE_CANDIDATE', event.candidate)
      }
    }

    connection.onconnectionstatechange = event => {
      if (connection.connectionState !== 'connected') {
        removeHandlers(socket, connection, messageListener, closeListener)
        reject(new Error('Connection closed'))
      }
    }

    channel.onopen = event => {
      removeHandlers(socket, connection, messageListener, closeListener)
      resolve(channel)
    }
  })
}

export function answerConnection (socket,
  { peerConnectionOptions, sendMessage, handleMessage }) {
  return new Promise((resolve, reject) => {
    const connection = new RTCPeerConnection(peerConnectionOptions)

    function messageListener (event) {
      handleMessage(event,
        remoteDescription => {
          connection.setRemoteDescription(remoteDescription)
          connection.createAnswer()
            .then(localDescription => {
              connection.setLocalDescription(localDescription)

              sendMessage(socket, 'SDP_ANSWER', localDescription)
            })
        },
        candidate => connection.addIceCandidate(candidate),
        reason => {
          removeHandlers(socket, connection, messageListener, closeListener)
          reject(reason)
        }
      )
    }

    function closeListener (event) {
      removeHandlers(socket, connection, messageListener, closeListener)
      reject(new Error('Socket closed'))
    }

    socket.addEventListener('message', messageListener)
    socket.addEventListener('close', closeListener)

    connection.onicecandidate = event => {
      if (event.candidate) {
        sendMessage(socket, 'ICE_CANDIDATE', event.candidate)
      }
    }

    connection.onconnectionstatechange = event => {
      if (connection.connectionState !== 'connected') {
        removeHandlers(socket, connection, messageListener, closeListener)
        reject(new Error('Connection closed'))
      }
    }

    connection.ondatachannel = event => {
      event.channel.onopen = () => {
        removeHandlers(socket, connection, messageListener, closeListener)
        resolve(event.channel)
      }
    }
  })
}
