import type { Writable } from "svelte/store";
import type { Socket } from "socket.io-client";

export type Methods = {
  [key: string]: Function
}

export type Path = (string | [string, 'array']);

export type TepkiState<T> = T & { isConnected: boolean };

export interface TepkiStore<T> extends Writable<TepkiState<T>> {
  connect: () => void,
  disconnect: () => void,
  call: (method: string, ...args: any[]) => Promise<any>,
  socket: Socket
}