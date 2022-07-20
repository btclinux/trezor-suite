import React from 'react';
import { Banner } from './Banner';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';

export const Coinjoin = () => {
    const coinjoin = useSelector(state => state.wallet.coinjoin);
    const registration = coinjoin.registrations.find(
        r => r.phase > 1 && r.phase < 4 && !r.completed,
    );
    if (!registration) return null;
    return <Banner variant="critical" body={<Translation id="TR_COINJOIN_CRITICAL_PHASE" />} />;
};
