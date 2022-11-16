import { APIMarket, WsKey } from '../types';
interface NetworkMapV3 {
    livenet: string;
    livenet2?: string;
    testnet: string;
    testnet2?: string;
}
declare type PublicPrivateNetwork = 'public' | 'private';
export declare const WS_BASE_URL_MAP: Record<APIMarket | 'unifiedPerpUSDT' | 'unifiedPerpUSDC', Record<PublicPrivateNetwork, NetworkMapV3>>;
export declare const WS_KEY_MAP: {
    readonly inverse: "inverse";
    readonly linearPrivate: "linearPrivate";
    readonly linearPublic: "linearPublic";
    readonly spotPrivate: "spotPrivate";
    readonly spotPublic: "spotPublic";
    readonly spotV3Private: "spotV3Private";
    readonly spotV3Public: "spotV3Public";
    readonly usdcOptionPrivate: "usdcOptionPrivate";
    readonly usdcOptionPublic: "usdcOptionPublic";
    readonly usdcPerpPrivate: "usdcPerpPrivate";
    readonly usdcPerpPublic: "usdcPerpPublic";
    readonly unifiedPrivate: "unifiedPrivate";
    readonly unifiedOptionPublic: "unifiedOptionPublic";
    readonly unifiedPerpUSDTPublic: "unifiedPerpUSDTPublic";
    readonly unifiedPerpUSDCPublic: "unifiedPerpUSDCPublic";
    readonly contractUSDTPublic: "contractUSDTPublic";
    readonly contractUSDTPrivate: "contractUSDTPrivate";
    readonly contractInversePublic: "contractInversePublic";
    readonly contractInversePrivate: "contractInversePrivate";
};
export declare const WS_AUTH_ON_CONNECT_KEYS: WsKey[];
export declare const PUBLIC_WS_KEYS: string[];
export declare function getWsKeyForTopic(market: APIMarket, topic: string, isPrivate?: boolean): WsKey;
export declare function getMaxTopicsPerSubscribeEvent(market: APIMarket): number | null;
export declare function getUsdcWsKeyForTopic(topic: string, subGroup: 'option' | 'perp'): WsKey;
export declare const WS_ERROR_ENUM: {
    NOT_AUTHENTICATED_SPOT_V3: string;
    API_ERROR_GENERIC: string;
    API_SIGN_AUTH_FAILED: string;
    USDC_OPTION_AUTH_FAILED: string;
};
export declare function neverGuard(x: never, msg: string): Error;
export {};
