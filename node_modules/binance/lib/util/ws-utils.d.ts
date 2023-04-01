import WebSocket from 'isomorphic-ws';
/**
 * #168: ws.terminate() is undefined in browsers.
 * This only works in node.js, not in browsers.
 * Does nothing if `ws` is undefined.
 */
export declare function safeTerminateWs(ws: WebSocket | unknown): void;
