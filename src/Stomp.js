// (c) 2010 Jeff Mesnil -- http://jmesnil.net/
// Copyright (C) FuseSource, Inc. --  http://fusesource.com

// Aggiornato da Lorenzo per supportare ES6 + Webpack 

function frame(command, headers, body) {
  return {
    command: command,
    headers: headers,
    body: body,
    toString: function () {
      var out = command + '\n'
      if (headers) {
        for (let header in headers) {
          if (headers.hasOwnProperty(header)) {
            out = out + header + ': ' + headers[header] + '\n'
          }
        }
      }
      out = out + '\n'
      if (body) {
        out = out + body
      }
      return out
    }
  }
}

function trim(str) {
  return str.replace(/^\s+/g, '').replace(/\s+$/g, '')
}

function unmarshal(data) {
  let divider = data.search(/\n\n/),
    headerLines = data.substring(0, divider).split('\n'),
    command = headerLines.shift(),
    headers = {},
    body = ''

  // Parse headers
  let line = null
  let idx = null
  for (var i = 0; i < headerLines.length; i++) {
    line = headerLines[i]
    idx = line.indexOf(':')
    headers[trim(line.substring(0, idx))] = trim(line.substring(idx + 1))
  }

  // Parse body, stopping at the first \0 found.
  // TODO: Add support for content-length header.
  var chr = null
  for (var i = divider + 2; i < data.length; i++) {
    chr = data.charAt(i)
    if (chr === '\0') {
      break
    }
    body += chr
  }

  return frame(command, headers, body)
}

function marshal(command, headers, body) {
  return frame(command, headers, body).toString() + '\0'
}

export default class Stomp {

  static client(url, _debug = false) {

    var that, ws, login, passcode
    var counter = 0 // used to index subscribers
    // subscription callbacks indexed by subscriber's ID
    var subscriptions = {}
    that = {}


    function debug (str) {
      if (_debug) {
        if (that.debug) {
          that.debug(str)
        }  
      }
    }

    function onmessage (evt) {
      var data = evt.data
      if (data instanceof ArrayBuffer) {
        view = new Uint8Array(data)
        data = ''
        var i, len
        for (i = 0, len = view.length; i < len; i++) {
          data += String.fromCharCode(view[i])
        }
      }
      debug('<<< ' + data)
      var frame = unmarshal(data)
      if (frame.command === 'CONNECTED' && that.connectCallback) {
        that.connectCallback(frame)
      } else if (frame.command === 'MESSAGE') {
        var onreceive = subscriptions[frame.headers.subscription]
        if (onreceive) {
          onreceive(frame)
        }
      } else if (frame.command === 'RECEIPT' && that.onreceipt) {
        that.onreceipt(frame)
      } else if (frame.command === 'ERROR' && that.onerror) {
        that.onerror(frame)
      }
    }

    function transmit(command, headers, body) {
      var out = marshal(command, headers, body)
      debug('>>> ' + out)
      ws.send(out)
    }

    that = {}

    that.connect = function (headers, connectCallback, errorCallback) {
      debug('Opening Web Socket...')
      var Socket = 'MozWebSocket' in window ? MozWebSocket : WebSocket
      ws = new Socket(url)
      ws.binaryType = 'arraybuffer'
      ws.onmessage = onmessage
      
      ws.onerror = function (event) {
        console.error("WebSocket error observed:", event)
      }

      ws.onclose = function () {
        var msg = 'Whoops! Lost connection to ' + url
        debug(msg)
        if (errorCallback) {
          errorCallback(msg)
        }
      }
      ws.onopen = function () {
        debug('Web Socket Opened...')
        transmit('CONNECT', headers)
        // connectCallback handler will be called from onmessage when a CONNECTED frame is received
      }
      that.connectCallback = connectCallback
    }

    that.disconnect = function (disconnectCallback) {
      transmit('DISCONNECT')
      ws.close()
      if (disconnectCallback) {
        disconnectCallback()
      }
    }

    that.send = function (destination, headers, body) {
      var headers = headers || {}
      headers.destination = destination
      transmit('SEND', headers, body)
    }

    that.subscribe = function (destination, callback, headers) {
      var headers = headers || {}
      var id = 'sub-' + counter++
      headers.destination = destination
      headers.id = id
      subscriptions[id] = callback
      transmit('SUBSCRIBE', headers)
      return id
    }

    that.unsubscribe = function (id, headers) {
      var headers = headers || {}
      headers.id = id
      delete subscriptions[id]
      transmit('UNSUBSCRIBE', headers)
    }

    that.begin = function (transaction, headers) {
      var headers = headers || {}
      headers.transaction = transaction
      transmit('BEGIN', headers)
    }

    that.commit = function (transaction, headers) {
      var headers = headers || {}
      headers.transaction = transaction
      transmit('COMMIT', headers)
    }

    that.abort = function (transaction, headers) {
      var headers = headers || {}
      headers.transaction = transaction
      transmit('ABORT', headers)
    }

    that.ack = function (message_id, headers) {
      var headers = headers || {}
      headers['message-id'] = message_id
      transmit('ACK', headers)
    }
    return that
  }
}
