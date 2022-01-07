import { io } from 'socket.io-client';
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

export function createStore<T>(name: string, path?: string, opts?: Partial<ManagerOptions & SocketOptions>): TepkiStore<T> {

  if(!path.endsWith('/')) path += '/';

  const socket = io(`${path}tepki/${name}`, opts);

  const { subscribe, update, set } = writable({ isConnected: false } as TepkiState<T>);

  socket.on('connect', () => {
    update(state => ({ ...state, isConnected: true }));
  });

  socket.on('disconnect', () => {
    update(state => ({ ...state, isConnected: false }));
  });

  socket.on('state', (state: T) => {
    set(Object.assign(state, { isConnected: true }));
  });

  socket.on('change', (diff: {path: Path[], value: any}) => {
    update(state => {
      applyDiff(state, diff.path, diff.value);
      return state;
    });
  });

  async function call(method: string, ...args: any[]) {
    return new Promise((resolve, reject) => {
      socket.emit('call', {
        method,
        args
      }, (success, result) => {
        if(success) resolve(result);
        else reject(result);
      });
    });
  }

  return {
    subscribe,
    update,
    set,
    connect: socket.connect,
    disconnect: socket.disconnect,
    call,
    socket
  }

}


