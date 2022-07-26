import React, { useState } from 'react';
import styled, { css } from 'styled-components';

import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';
import { P, Button } from '@trezor/components';
import { Image } from '@suite-components';
import { ThemeProvider } from '@suite-support/ThemeProvider';
import { TorStatus } from '@suite-types';

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const Text = styled(P)`
    height: 0;
`;

const ModalWindow = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 16px;
    text-align: center;
    transition: all 0.3s;
    max-width: 95%;
    min-width: 305px;
    width: 720px;
    padding: 42px;

    ${({ theme }) =>
        css`
            background: ${theme.BG_WHITE};
            box-shadow: 0 10px 80px 0 ${theme.BOX_SHADOW_MODAL};
        `}
`;

const Percentage = styled.div`
    display: flex;
    margin-left: 10px;
    font-variant-numeric: tabular-nums;
    height: 24px;
`;

interface ModulesLoadingScreenProps {
    callback?: (value?: unknown) => void | null;
}

export const ModulesLoadingScreen = ({ callback }: ModulesLoadingScreenProps) => {
    const [torStatus, setTorStatus] = useState<TorStatus>(TorStatus.Enabling);
    const [torBootstrap, setTorBootstrap] = useState<BootstrapTorEvent>();
    console.log('torBootstrap', torBootstrap);
    console.log('torStatus', torStatus);

    const isErrorHandlingMode = {}.toString.call(callback) === '[object Function]';

    // When component re-renders we unsubscribe and subscribe again, to avoid memory leaks.
    desktopApi.removeAllListeners('tor/bootstrap');
    desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
        setTorBootstrap(bootstrapEvent);

        if (bootstrapEvent.type !== 'progress') return;
        if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
            desktopApi.removeAllListeners('tor/bootstrap');
            setTorStatus(TorStatus.Enabled);
            if (callback) {
                callback();
            }
        } else {
            setTorStatus(TorStatus.Enabling);
        }
    });

    if (isErrorHandlingMode && [TorStatus.Enabling].includes(torStatus)) {
        setTorStatus(TorStatus.Error);
    }

    let message = 'Enabling TOR';
    if (torStatus === TorStatus.Error) {
        message = 'Enabling TOR Failed';
    }

    const tryAgain = () => {
        setTorStatus(TorStatus.Enabling);
        return desktopApi.toggleTor(true);
    };

    const disableTor = () => {
        desktopApi.toggleTor(false);
        if (callback) {
            callback();
        }
    };

    const progress =
        (torBootstrap &&
            torBootstrap.type === 'progress' &&
            torBootstrap.progress &&
            torBootstrap.progress.current) ||
        0;

    return (
        <ThemeProvider>
            <Wrapper>
                <ModalWindow>
                    <Image width={60} height={60} image="TOR_ENABELING" />

                    <Text>{message}</Text>
                    <progress value={progress} max="100" />
                    <Percentage>{progress} %</Percentage>
                    <Button
                        onClick={e => {
                            e.stopPropagation();
                            disableTor();
                        }}
                    >
                        Disable TOR
                    </Button>
                    {torStatus === TorStatus.Error && (
                        <Button
                            onClick={e => {
                                e.stopPropagation();
                                tryAgain();
                            }}
                        >
                            Try Again
                        </Button>
                    )}
                </ModalWindow>
            </Wrapper>
        </ThemeProvider>
    );
};
