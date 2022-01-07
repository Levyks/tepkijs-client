# Tepki.JS

## Work in Progress

Remote stores powered by Socket.IO with a Vue/Vuex like syntax in the backend.

[Server repo](https://github.com/Levyks/tepkijs)

Server:
```ts
import { createStore } from 'tepkijs';
import { Server } from 'socket.io';

const io = new Server(5000, {
  cors: {
    origin: '*',
  }
});

type State = {
  messages: string[]
}

const store = createStore({
  io, name: 'room-01',
  data(): State {
    return {
      messages: []
    }
  },
  methods: {
    addMessage(message) {
      this.messages.push(message);
    }
  }
});
```

Client (Svelte):
`stores.ts`:
```ts
import { createStore } from 'tepkijs-client';  
import type { TepkiStore } from 'tepkijs-client';

type State = {
  messages: string[]
}

export const store: TepkiStore<State> = createStore('room-01', 'http://localhost:5000');
```
```svelte
<script lang="ts">

  import { store } from './stores';

  let message = '';

  function sendMessage() {
    store.call('addMessage', message);
    message = '';
  }

</script>

<main>
  {#if $store.isConnected}
    <ul>
      {#each $store.messages as message}
        <li>{message}</li>
      {/each}
    </ul>
    
    <input bind:value={message}>
    <button on:click={sendMessage}>Send</button>
  {/if}
</main>
```

