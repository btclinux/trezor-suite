import React from 'react';
import styled, { ThemeProvider, StyleSheetManager } from 'styled-components';
import { THEME } from '@trezor/components';

const View = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
`;

// todo: does 'support' folder make sense for this?
// todo: how do we type react components in july 2022?
interface Props {
    children: React.ReactChildren;
}

export const ReactWrapper = (props: Props) => {
    const styleSlot = document.getElementById('react');

    if (!styleSlot?.shadowRoot) {
        console.error('could not find shadow-root to mount react application');
    }

    return (
        // @ts-ignore. typings don't like using shadowRoot as target but it works
        <StyleSheetManager target={styleSlot.shadowRoot!}>
            <ThemeProvider theme={THEME.light}>
                <View>{props.children}</View>
            </ThemeProvider>
        </StyleSheetManager>
    );
};
