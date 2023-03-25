"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeTerminateWs = void 0;
/**
 * #168: ws.terminate() is undefined in browsers.
 * This only works in node.js, not in browsers.
 * Does nothing if `ws` is undefined.
 */
function safeTerminateWs(ws) {
    // #168: ws.terminate() undefined in browsers
    if (typeof (ws === null || ws === void 0 ? void 0 : ws.terminate) === 'function' && ws) {
        ws.terminate();
    }
}
exports.safeTerminateWs = safeTerminateWs;
//# sourceMappingURL=ws-utils.js.map