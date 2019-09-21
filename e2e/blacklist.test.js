const express = require('express');
const path = require('path');
const assert = require('assert');
const settings = require('./settings');
const { Builder } = require('lanthan');
const { By } = require('selenium-webdriver');

const newApp = () => {
  let app = express();
  app.get('/*', (req, res) => {
    res.status(200).send(`<!DOCTYPEhtml>
<html lang="en">
  <body style="width:10000px; height:10000px"></body>
</html>`);
  });
  return app;
};

describe("navigate test", () => {

  const port = 12321;
  let http;
  let lanthan;
  let webdriver;
  let browser;

  before(async() => {
    http = newApp().listen(port);

    lanthan = await Builder
      .forBrowser('firefox')
      .spyAddon(path.join(__dirname, '..'))
      .build();
    webdriver = lanthan.getWebDriver();
    browser = lanthan.getWebExtBrowser();
  });

  after(async() => {
    if (lanthan) {
      await lanthan.quit();
    }
    http.close();
  });

  it('should disable add-on if the URL is in the blacklist', async () => {
    await browser.storage.local.set({
      settings: {
        source: 'json',
        json: `{
        "keymaps": {
          "j": { "type": "scroll.vertically", "count": 1 }
        },
        "blacklist": [ "127.0.0.1:${port}/a" ]
      }`,
      },
    });

    await webdriver.navigate().to(`http://127.0.0.1:${port}/a`);

    let body = await webdriver.findElement(By.css('body'));
    await body.sendKeys('j');

    // not works
    let pageYOffset = await webdriver.executeScript(() => window.pageYOffset);
    assert.equal(pageYOffset, 0);

    await webdriver.navigate().to(`http://127.0.0.1:${port}/ab`);
    body = await webdriver.findElement(By.css('body'));
    await body.sendKeys('j');

    // works
    pageYOffset = await webdriver.executeScript(() => window.pageYOffset);
    assert.equal(pageYOffset, 64);
  });
});

