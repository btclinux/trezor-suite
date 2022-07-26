// @group:migrations
// @retry=2

const assertPersistence = () => {
    // todo: put assertions for persistance here to avoid repetition
};

describe('Metadata - persistent data', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440);
    });

    it('Test data that should survive refresh and database migration', () => {
        // KEEP_DB env is falsy.
        // This block will execute only when testing the first TEST_URL
        if (!Cypress.env('KEEP_DB')) {
            cy.resetDb();
            // todo:create data that are to be tested later in this block.

            // go through onboarding
            // wait for discovery
            // add some passphrase wallet
            // remember wallets
            // change settings (language, currency, theme)
            // backends, custom urls
            // nice to have: labeling
        }

        // Test refreshing app here. make few assertions that data survived
        assertPersistence();

        // KEEP_DB env is truthy.
        // This block will execute only in every other run expect for the first one
        // It means that migration took place and we should see the same data
        if (Cypress.env('KEEP_DB')) {
            assertPersistence();
        }
    });
});
