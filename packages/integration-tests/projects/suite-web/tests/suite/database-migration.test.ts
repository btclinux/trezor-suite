// @group:migrations
// @retry=2

describe('Database migration', () => {
    beforeEach(() => {
        cy.viewport(1080, 1440);
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');
        cy.prefixedVisit('/');
    });

    it('Test data that should survive database migration', () => {
        // KEEP_DB env is falsy.
        // This block will execute only when testing the first TEST_URL
        if (!Cypress.env('KEEP_DB')) {
            cy.resetDb();

            cy.passThroughInitialRun();
            cy.discoveryShouldFinish();

            // reload page, we should already have some data in local state
            // for example no initial run takes place now
            cy.reload();
            cy.discoveryShouldFinish();

            // todo:create data that are to be tested later in this block.

            // add some passphrase wallet
            // remember wallets
            // change settings (language, currency, theme)
            // backends, custom urls
            // nice to have: labeling
        }

        // KEEP_DB env is truthy.
        // This block will execute only in every other run expect for the first one
        // It means that migration took place and we should see the same data
        if (Cypress.env('KEEP_DB')) {
            // asset data was loaded correctly from db
            cy.getTestElement('@dashboard/graph', { timeout: 30000 }).should('exist');
        }
    });
});
