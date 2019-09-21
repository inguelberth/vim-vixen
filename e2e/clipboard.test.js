const express = require('express');
const path = require('path');
const assert = require('assert');
const eventually = require('./eventually');
const clipboard = require('./lib/clipboard');
const settings = require('./settings');
const { Builder } = require('lanthan');
const { By, Key } = require('selenium-webdriver');

const newApp = () => {
  let app = express();
  app.get('/', (req, res) => {
    res.status(200).send(`<html lang="en"></html">`);
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

    await browser.storage.local.set({
      settings,
    });
  });

  after(async() => {
    if (lanthan) {
      await lanthan.quit();
    }
    http.close();
  });

  beforeEach(async() => {
    let tabs = await browser.tabs.query({});
    for (let tab of tabs.slice(1)) {
      await browser.tabs.remove(tab.id);
    }
  })

  it('should copy current URL by y', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}/#should_copy_url`);
    let body = await webdriver.findElement(By.css('body'));

    await body.sendKeys('y');
    await eventually(async() => {
      let data = await clipboard.read();
      assert.equal(data, `http://127.0.0.1:${port}/#should_copy_url`);
    });
  });

  it('should open an URL from clipboard by p', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}/`);
    let body = await webdriver.findElement(By.css('body'));

    await clipboard.write(`http://127.0.0.1:${port}/#open_from_clipboard`);
    await body.sendKeys('p');

    await eventually(async() => {
      let tabs = await browser.tabs.query({ active: true });
      assert.equal(tabs[0].url, `http://127.0.0.1:${port}/#open_from_clipboard`);
    });
  });

  it('should open an URL from clipboard to new tab by P', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}/`);
    let body = await webdriver.findElement(By.css('body'));

    await clipboard.write(`http://127.0.0.1:${port}/#open_to_new_tab`);
    await body.sendKeys(Key.SHIFT, 'p');

    await eventually(async() => {
      let tabs = await browser.tabs.query({});
      assert.deepEqual(tabs.map(t => t.url), [
        `http://127.0.0.1:${port}/`,
        `http://127.0.0.1:${port}/#open_to_new_tab`,
      ]);
    });
  });

  it('should open search result with keywords in clipboard by p', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}/`);
    let body = await webdriver.findElement(By.css('body'));

    await clipboard.write(`an apple`);
    await body.sendKeys('p');

    await eventually(async() => {
      let tabs = await browser.tabs.query({});
      assert.equal(tabs[0].url, `http://127.0.0.1:${port}/google?q=an%20apple`);
    });
  });

  it('should open search result with keywords in clipboard to new tabby P', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}/`);
    let body = await webdriver.findElement(By.css('body'));

    await clipboard.write(`an apple`);
    await body.sendKeys(Key.SHIFT, 'p');

    await eventually(async() => {
      let tabs = await browser.tabs.query({});
      assert.deepEqual(tabs.map(t => t.url), [
        `http://127.0.0.1:${port}/`,
        `http://127.0.0.1:${port}/google?q=an%20apple`,
      ]);
    });
  });
});
