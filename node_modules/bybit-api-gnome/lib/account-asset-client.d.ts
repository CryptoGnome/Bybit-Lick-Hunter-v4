import { AccountAssetInformationRequest, APIResponseWithTime, DepositRecordsRequest, EnableUniversalTransferRequest, InternalTransferRequest, SubAccountTransferRequest, SupportedDepositListRequest, TransferQueryRequest, UniversalTransferRequest, WithdrawalRecordsRequest, WithdrawalRequest } from './types';
import BaseRestClient from './util/BaseRestClient';
/**
 * REST API client for Account Asset APIs
 */
export declare class AccountAssetClient extends BaseRestClient {
    getClientType(): "accountAsset";
    fetchServerTime(): Promise<number>;
    /**
     *
     * Transfer Data Endpoints
     *
     */
    createInternalTransfer(params: InternalTransferRequest): Promise<APIResponseWithTime<any>>;
    createSubAccountTransfer(params: SubAccountTransferRequest): Promise<APIResponseWithTime<any>>;
    getInternalTransfers(params?: TransferQueryRequest): Promise<APIResponseWithTime<any>>;
    getSubAccountTransfers(params?: TransferQueryRequest): Promise<APIResponseWithTime<any>>;
    getSubAccounts(): Promise<APIResponseWithTime<any>>;
    enableUniversalTransfer(params?: EnableUniversalTransferRequest): Promise<APIResponseWithTime<any>>;
    createUniversalTransfer(params: UniversalTransferRequest): Promise<APIResponseWithTime<any>>;
    getUniversalTransfers(params?: TransferQueryRequest): Promise<APIResponseWithTime<any>>;
    /**
     *
     * Wallet & Deposit Endpoints
     *
     */
    getSupportedDepositList(params?: SupportedDepositListRequest): Promise<APIResponseWithTime<any>>;
    getDepositRecords(params?: DepositRecordsRequest): Promise<APIResponseWithTime<any>>;
    getWithdrawRecords(params?: WithdrawalRecordsRequest): Promise<APIResponseWithTime<any>>;
    getCoinInformation(coin?: string): Promise<APIResponseWithTime<any>>;
    getAssetInformation(params?: AccountAssetInformationRequest): Promise<APIResponseWithTime<any>>;
    submitWithdrawal(params: WithdrawalRequest): Promise<APIResponseWithTime<any>>;
    cancelWithdrawal(withdrawalId: number): Promise<APIResponseWithTime<any>>;
    getDepositAddress(coin: string): Promise<APIResponseWithTime<any>>;
    /**
     *
     * API Data Endpoints
     *
     */
    getServerTime(): Promise<APIResponseWithTime>;
    getApiAnnouncements(): Promise<APIResponseWithTime<any[]>>;
}
