import { httpRequest as request, RequestOptions } from './http';
import {
    AllowedRange,
    IssuerParameter,
    ZeroCredentials,
    RealCredentials,
    Credentials,
    CredentialsResponseValidation,
} from './types';

export const getRealCredentials = async (
    amountsToRequest: number[],
    credentialsToPresent: Credentials[],
    credentialIssuerParameters: IssuerParameter,
    maxCredentialValue: number,
    options: RequestOptions,
) => {
    const data = await request<{ realCredentialsRequestData: RealCredentials }>(
        'create-request',
        {
            amountsToRequest,
            credentialIssuerParameters,
            maxCredentialValue,
            credentialsToPresent,
        },
        options,
    );
    return data.realCredentialsRequestData;
};

export const getZeroCredentials = async (issuer: IssuerParameter, options: RequestOptions) => {
    const data = await request<{ zeroCredentialsRequestData: ZeroCredentials }>(
        'create-request-for-zero-amount',
        {
            credentialIssuerParameters: issuer,
        },
        options,
    );
    return data.zeroCredentialsRequestData;
};

export const getCredentials = async (
    credentialIssuerParameters: IssuerParameter,
    registrationResponse: RealCredentials,
    registrationValidationData: CredentialsResponseValidation,
    options: RequestOptions,
) => {
    const data = await request<{ credentials: Credentials[] }>(
        'handle-response',
        {
            credentialIssuerParameters,
            registrationResponse,
            registrationValidationData,
        },
        options,
    );
    return data.credentials;
};

export const decomposeAmounts = async (
    constants: { feeRate: number; allowedOutputAmounts: AllowedRange },
    outputSize: number,
    availableVsize: number,
    internalAmounts: number[],
    externalAmounts: number[],
    options: RequestOptions,
) => {
    const data = await request<{ outputAmounts: number[] }>(
        'decompose-amounts',
        {
            constants,
            outputSize,
            availableVsize,
            internalAmounts,
            externalAmounts,
            strategy: 'minimum_cost',
        },
        options,
    );
    return data.outputAmounts;
};
