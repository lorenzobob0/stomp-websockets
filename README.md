# stomp-websockets

A fork of Jeff Mesnil stomp-websocket adapted as a npm mobule and webpack compatible

# How to use:

```javascript
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