import MemoryStorage from '../infrastructures/memory-storage';
import TabPresenter from '../presenters/tab';
import ConsolePresenter from '../presenters/console';

const CURRENT_SELECTED_KEY = 'tabs.current.selected';
const LAST_SELECTED_KEY = 'tabs.last.selected';

const ZOOM_SETTINGS = [
  0.33, 0.50, 0.66, 0.75, 0.80, 0.90, 1.00,
  1.10, 1.25, 1.50, 1.75, 2.00, 2.50, 3.00
];

export default class OperationInteractor {
  constructor() {
    this.tabPresenter = new TabPresenter();
    this.tabPresenter.onSelected(info => this.onTabSelected(info.tabId));

    this.consolePresenter = new ConsolePresenter();

    this.cache = new MemoryStorage();
  }

  async close(force) {
    let tab = await this.tabPresenter.getCurrent();
    if (!force && tab.pinned) {
      return;
    }
    return this.tabPresenter.remove([tab.id]);
  }

  reopen() {
    return this.tabPresenter.reopen();
  }

  async selectPrev(count) {
    let tabs = await this.tabPresenter.getAll();
    if (tabs.length < 2) {
      return;
    }
    let tab = tabs.find(t => t.active);
    if (!tab) {
      return;
    }
    let select = (tab.index - count + tabs.length) % tabs.length;
    return this.tabPresenter.select(tabs[select].id);
  }

  async selectNext(count) {
    let tabs = await this.tabPresenter.getAll();
    if (tabs.length < 2) {
      return;
    }
    let tab = tabs.find(t => t.active);
    if (!tab) {
      return;
    }
    let select = (tab.index + count) % tabs.length;
    return this.tabPresenter.select(tabs[select].id);
  }

  async selectFirst() {
    let tabs = await this.tabPresenter.getAll();
    return this.tabPresenter.select(tabs[0].id);
  }

  async selectLast() {
    let tabs = await this.tabPresenter.getAll();
    return this.tabPresenter.select(tabs[tabs.length - 1].id);
  }

  async selectPrevSelected() {
    let tabId = await this.cache.get(LAST_SELECTED_KEY);
    if (tabId === null || typeof tabId === 'undefined') {
      return;
    }
    this.tabPresenter.select(tabId);
  }

  async reload(cache) {
    let tab = await this.tabPresenter.getCurrent();
    return this.tabPresenter.reload(tab.id, cache);
  }

  async setPinned(pinned) {
    let tab = await this.tabPresenter.getCurrent();
    return this.tabPresenter.setPinned(tab.id, pinned);
  }

  async togglePinned() {
    let tab = await this.tabPresenter.getCurrent();
    return this.tabPresenter.setPinned(tab.id, !tab.pinned);
  }

  async duplicate() {
    let tab = await this.tabPresenter.getCurrent();
    return this.tabPresenter.duplicate(tab.id);
  }

  async openPageSource() {
    let tab = await this.tabPresenter.getCurrent();
    let url = 'view-source:' + tab.url;
    return this.tabPresenter.create(url);
  }

  async zoomIn(tabId) {
    let tab = await this.tabPresenter.getCurrent();
    let current = await this.tabPresenter.getZoom(tab.id);
    let factor = ZOOM_SETTINGS.find(f => f > current);
    if (factor) {
      return this.tabPresenter.setZoom(tabId, factor);
    }
  }

  async zoomOut(tabId) {
    let tab = await this.tabPresenter.getCurrent();
    let current = await this.tabPresenter.getZoom(tab.id);
    let factor = [].concat(ZOOM_SETTINGS).reverse().find(f => f < current);
    if (factor) {
      return this.tabPresenter.setZoom(tabId, factor);
    }
  }

  zoomNutoral(tabId) {
    return this.tabPresenter.setZoom(tabId, 1);
  }

  async showCommand() {
    let tab = await this.tabPresenter.getCurrent();
    return this.consolePresenter.showCommand(tab.id, '');
  }

  async showOpenCommand(alter) {
    let tab = await this.tabPresenter.getCurrent();
    let command = 'open ';
    if (alter) {
      command += tab.url;
    }
    return this.consolePresenter.showCommand(tab.id, command);
  }

  async showTabopenCommand(alter) {
    let tab = await this.tabPresenter.getCurrent();
    let command = 'tabopen ';
    if (alter) {
      command += tab.url;
    }
    return this.consolePresenter.showCommand(tab.id, command);
  }

  async showWinopenCommand(alter) {
    let tab = await this.tabPresenter.getCurrent();
    let command = 'winopen ';
    if (alter) {
      command += tab.url;
    }
    return this.consolePresenter.showCommand(tab.id, command);
  }

  async showBufferCommand() {
    let tab = await this.tabPresenter.getCurrent();
    let command = 'buffer ';
    return this.consolePresenter.showCommand(tab.id, command);
  }

  async showAddbookmarkCommand(alter) {
    let tab = await this.tabPresenter.getCurrent();
    let command = 'addbookmark ';
    if (alter) {
      command += tab.title;
    }
    return this.consolePresenter.showCommand(tab.id, command);
  }

  async findStart() {
    let tab = await this.tabPresenter.getCurrent();
    return this.consolePresenter.showFind(tab.id);
  }

  async hideConsole() {
    let tab = await this.tabPresenter.getCurrent();
    return this.consolePresenter.hide(tab.id);
  }

  onTabSelected(tabId) {
    let lastId = this.cache.get(CURRENT_SELECTED_KEY);
    if (lastId) {
      this.cache.set(LAST_SELECTED_KEY, lastId);
    }
    this.cache.set(CURRENT_SELECTED_KEY, tabId);
  }
}

