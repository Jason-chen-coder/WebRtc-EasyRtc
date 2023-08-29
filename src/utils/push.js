import io from 'socket.io-client'



export function getFetchVideoSocket (serverUrl, token,roomId) {
    const opts = {
      path: '/push-server',
      transports: ['websocket'],
      auth:{
        token,
        roomId
      }
      // transportOptions: {
      //   polling: {
      //     extraHeaders: {
      //       token
      //     }
      //   },
      // }
    }
    console.log(`连接: ${serverUrl},options: ${JSON.stringify(opts)}`)
    return io(serverUrl, opts)
  }

  export const socketPromise = function (socket) {
    return function request (type, data = {}) {
      return new Promise((resolve) => {
        socket.emit(type, data, resolve)
      })
    }
  }