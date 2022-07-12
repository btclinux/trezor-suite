import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { SUITE_BRIDGE_URL } from '@trezor/urls';
import { ManWithLaptop } from '../components/ManWithLaptop';

// todo: some unifying components? something to make sure header, text, description are always on the same place
const Text = styled.div`
    margin-bottom: 8%;
    max-width: 390px;
`;

const Buttons = styled.div`
    margin-top: 8%;
`;

export const Transport = () => (
    // todo: should views be wrapped like this? <></>
    <>
        <Text>
            <h3>Install Bridge</h3>
            <p>
                The Bridge is a communication tool, which facilitates the connection between your
                Trezor device and your internet browser.
            </p>
        </Text>
        <ManWithLaptop />
        <Buttons>
            <Button
                variant="primary"
                icon="EXTERNAL_LINK"
                // todo: suggested way of opening new tabs?
                onClick={() => window.open(SUITE_BRIDGE_URL)}
            >
                Install Bridge
            </Button>
        </Buttons>
    </>
);
