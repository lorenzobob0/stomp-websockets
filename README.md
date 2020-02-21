# stomp-websockets

A fork of Jeff Mesnil stomp-websocket adapted as a npm mobule and webpack compatible

# How to use:

Fist, install stomp-websockets 

```
npm install stomp-websockets --save
```


```javascript
import Stomp from 'stomp-websockets'

let stomp = Stomp.client(serverURL)
stomp.connect(login, passcode,
    () => { // On success
        stomp.subscribe(topicName, msg => {
            alert('Received message')
        })
    },
    error => { // On error
        console.log('STOMP Error - Connection')
        console.log(error)
        if (!stomp.connected) {
        setTimeout(function () {
            console.log('Connection: retry')
            // try to reconnect
        }, 10000) // 10 secondi
    }
}
```

# How to build

This version of Stomp uses ES6 syntax. To transiple it in ES5 to support older browsers, use thi command:

```
npm run build
```
The generated javascript file is dist/Stomp.js