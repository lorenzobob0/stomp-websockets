# stomp-websockets

A fork of Jeff Mesnil's stomp-websocket adapted as a npm module and webpack compatible

# How to use:

First, install stomp-websockets 

```
npm install stomp-websockets --save
```


```javascript
import Stomp from 'stomp-websockets'

let stomp = Stomp.client(serverURL)
let headers = {
    login: 'my login',
    passcode: 'my passcode',
    'client-id': 'myclientid'
}
stomp.connect(headers,
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
})
```




# How to build

This version of Stomp uses ES6 syntax. To transpile it into ES5 to support older browsers, use this command:

```
npm run build
```
The generated JavaScript file is dist/Stomp.js
