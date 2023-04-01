import { WsFormattedMessage } from '../types/websockets';
export default class Beautifier {
    private beautificationMap;
    private floatKeys;
    private floatKeysHashMap;
    constructor();
    beautifyValueWithKey(key: string | number, val: unknown): unknown;
    /**
     * Beautify array or object, recurisvely
     */
    beautifyObjectValues(data: any | any[]): {};
    beautifyArrayValues(data: any[], parentKey?: string | number): any[];
    beautify(data: any, key?: string | number): any;
    /**
     * Entry point to beautify WS message. EventType is determined automatically unless this is a combined stream event.
     */
    beautifyWsMessage(data: any, eventType?: string, isCombined?: boolean): WsFormattedMessage;
}
