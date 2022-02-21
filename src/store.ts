import { io, Socket } from 'socket.io-client';
import type { ManagerOptions, SocketOptions } from 'socket.io-client';
import type { Path } from './typings';
import { writable } from 'svelte/store';

import type { TepkiStore, TepkiState } from './typings';

function applyDiff(schema: any, paths: Path[], value: any) {

  function getRealPath(path: Path): string {
    return path instanceof Array ? path[0] : path;
  }

  function createSchema(schema: any, path: Path) {
    if(!(path instanceof Array)) {
      schema[path] = {};
      return;
    }
  
    switch(path[1]) {
      case 'array':
        schema[path[0]] = [];
        break;
      default:
        throw new Error(`Unknown schema type ${path[1]}`);
    }
  }

  for(let i = 0; i < paths.length - 1; i++) {
    const path = paths[i];

    const real_path = getRealPath(path);
  
    if(!schema[real_path]) {
      createSchema(schema, path);
    }
    schema = schema[real_path];

  }

  schema[getRealPath(paths[paths.length - 1])] = value;

}

export function createStore<T>(name?: string, url?: string, opts?: Partial<ManagerOptions & SocketOptions>): TepkiStore<T> {

  async function call(method: string, ...args: any[]) {
    return new Promise((resolve, reject) => {
      store.socket.emit('call', {
        method,
        args
      }, (success, result) => {
        if(success) resolve(result);
        else reject(result);
      });
    });
  }

  const store = {
    ...writable({ isConnected: false } as TepkiState<T>),
    socket: null as Socket,
    call,
    connect,
  }

  function connect(name: string, url?: string, opts?: Partial<ManagerOptions & SocketOptions>): Promise<TepkiStore<T>> {

    return new Promise((resolve, reject) => {

      if(!url.endsWith('/')) url += '/';

      if(store.socket) store.socket.close();

      store.socket = io(`${url}tepki/${name}`, opts);
  
      store.socket.on('connect', () => {
        store.update(state => ({ ...state, isConnected: true }));
        resolve(store);
      });

      store.socket.once('connect_error', (err) => {
        reject(err)
      });
    
      store.socket.on('disconnect', () => {
        store.update(state => ({ ...state, isConnected: false }));
      });
    
      store.socket.on('state', (state: T) => {
        store.set(Object.assign(state, { isConnected: true }));
      });
    
      store.socket.on('change', (diff: {path: Path[], value: any}) => {
        store.update(state => {
          applyDiff(state, diff.path, diff.value);
          return state;
        });
      });

    });
  
  }
  
  if(name) connect(name, url, opts);

  return store;

}


