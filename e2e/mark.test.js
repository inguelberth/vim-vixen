const express = require('express');
const path = require('path');
const assert = require('assert');
const eventually = require('./eventually');
const { Builder } = require('lanthan');
const { By } = require('selenium-webdriver');

const newApp = () => {
  let app = express();
  app.get('/', (req, res) => {
    res.send(`<!DOCTYPEhtml>
<html lang="en">
  <body style="width:10000px; height:10000px"></body>
</html">`);
  });
  return app;
};

describe("mark test", () => {

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
    if (http) {
      http.close();
    }
  });

  it('should set a local mark and jump to it', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}`);
    let body = await webdriver.findElement(By.css('body'));

    await webdriver.executeScript(() => window.scrollTo(200, 200));
    await body.sendKeys('m', 'a');
    await webdriver.executeScript(() => window.scrollTo(500, 500));
    await body.sendKeys('\'', 'a');

    await eventually(async() => {
      let pageXOffset = await webdriver.executeScript(() => window.pageXOffset);
      let pageYOffset = await webdriver.executeScript(() => window.pageYOffset);
      assert.equal(pageXOffset, 200);
      assert.equal(pageYOffset, 200);
    });
  });

  it('should set a global mark and jump to it', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}#first`);
    let body = await webdriver.findElement(By.css('body'));

    await webdriver.executeScript(() => window.scrollTo(200, 200));
    await body.sendKeys('m', 'A');
    await webdriver.executeScript(() => window.scrollTo(500, 500));
    await body.sendKeys('\'', 'A');

    await eventually(async() => {
      let pageXOffset = await webdriver.executeScript(() => window.pageXOffset);
      let pageYOffset = await webdriver.executeScript(() => window.pageYOffset);
      assert.equal(pageXOffset, 200);
      assert.equal(pageYOffset, 200);
    });

    await browser.tabs.create({ url: `http://127.0.0.1:${port}#second` });
    body = await webdriver.findElement(By.css('body'));
    await body.sendKeys('\'', 'A');

    await eventually(async() => {
      let tab = (await browser.tabs.query({ active: true }))[0];
      let url = new URL(tab.url);
      assert.equal(url.hash, '#first');

      let pageXOffset = await webdriver.executeScript(() => window.pageXOffset);
      let pageYOffset = await webdriver.executeScript(() => window.pageYOffset);
      assert.equal(pageXOffset, 200);
      assert.equal(pageYOffset, 200);
    });
  });

  it('set a global mark and creates new tab from gone', async () => {
    await webdriver.navigate().to(`http://127.0.0.1:${port}#first`);
    await webdriver.executeScript(() => window.scrollTo(500, 500));
    let body = await webdriver.findElement(By.css('body'));
    await body.sendKeys('m', 'A');

    let tab = (await browser.tabs.query({ active: true }))[0];
    await browser.tabs.create({ url: `http://127.0.0.1:${port}#second` });
    await browser.tabs.remove(tab.id);

    let handles;
    await eventually(async() => {
      handles = await webdriver.getAllWindowHandles();
      assert.equal(handles.length, 2);
    });
    await webdriver.switchTo().window(handles[0]);
    await webdriver.navigate().to(`http://127.0.0.1:${port}#second`);
    body = await webdriver.findElement(By.css('body'));
    await body.sendKeys('\'', 'A');

    await eventually(async() => {
      let tab = (await browser.tabs.query({ active: true }))[0];
      let url = new URL(tab.url);
      assert.equal(url.hash, '#first');
    });
  });
});


