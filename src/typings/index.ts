import type { Writable } from "svelte/store";
import type { Socket, ManagerOptions, SocketOptions } from "socket.io-client";

export type Methods = {
  [key: string]: Function
}

export type Path = (string | [string, 'array']);

export type TepkiState<T> = T & { isConnected: boolean };

export interface TepkiStore<T> extends Writable<TepkiState<T>> {
  call: (method: string, ...args: any[]) => Promise<any>,
  connect: (name: string, url?: string, opts?: Partial<ManagerOptions & SocketOptions>) =>  Promise<TepkiStore<T>>
  socket: Socket
}