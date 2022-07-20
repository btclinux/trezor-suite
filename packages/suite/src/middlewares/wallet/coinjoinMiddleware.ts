import type { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import * as coinjoinActions from '@wallet-actions/coinjoinActions';
import type { AppState, Action, Dispatch } from '@suite-types';

export const coinjoinMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // propagate action to reducers
        next(action);

        if (action.type === SUITE.READY) {
            api.dispatch(coinjoinActions.restoreCoinJoin());
        }

        if (action.type === ACCOUNT.UPDATE) {
            api.dispatch(coinjoinActions.updateCoinjoinAccount(action.payload));
        }

        // TODO:
        // - device connection (restore coinjoin)
        // - device disconnection
        // - wallet/account remove
        // - offline/online (stop/start coinjoin)
        // - analitics, what should be measured? (NOTE using tor?)

        return action;
    };
