describe('Wikipedia iOS app test', function() {
  before(function(app) {
    app.click('xpath', '//XCUIElementTypeButton[@name="Skip"]');
  });

  it('Search for BrowserStack', async function(app) {
    // click on search bar at the top.
    const searchField = app.element(by.xpath('//XCUIElementTypeSearchField[@name="Search Wikipedia"]'));
    searchField.click();

    // above step will open another search field (with same xpath), type 'browserstack' in that.
    const editableSearchField = app.element(by.xpath('//XCUIElementTypeSearchField[@name="Search Wikipedia"]'));
    editableSearchField.sendKeys('browserstack');

    // click on search result with name attribute as 'BrowserStack'.
    const bstackSearchResult = app.element(by.xpath('//XCUIElementTypeStaticText[@name="BrowserStack"]'));
    bstackSearchResult.click();

    // assert the title of the opened page.
    const pageTitle = app.element(by.xpath('(//XCUIElementTypeStaticText[@name="BrowserStack"])[1]'));
    pageTitle.getText().assert.equals('BrowserStack');
  });
});
