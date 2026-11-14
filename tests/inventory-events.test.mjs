import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const coreUrl = moduleUrl(await readFile(new URL('../docs/assets/javascripts/inventory-core.js', import.meta.url), 'utf8'));
const browserSource = (await readFile(new URL('../docs/assets/javascripts/inventory.js', import.meta.url), 'utf8'))
  .replace("'./inventory-core.js'", JSON.stringify(coreUrl));
let instance = 0;

// Minimal DOM ports run the real event handlers and table rendering without a browser dependency.
class Element {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase(); this.children = []; this.dataset = {};
    this.listeners = new Map(); this.attributes = new Map(); this.hidden = true;
    this.checked = false; this.disabled = false; this.textContent = ''; this._value = '';
    this.classList = { toggle() {} };
  }
  get value() { return this._value; }
  set value(value) { this._value = String(value); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(callback);
  }
  dispatch(name) { this.listeners.get(name)?.forEach(callback => callback({ target: this })); }
  querySelector() { return null; }
  focus() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.dispatch('close'); }
}

async function mount(t, { search = '', recordCount = 3 } = {}) {
  const ids = [
    'inventory-app', 'inventory-search', 'filter-category', 'filter-location',
    'filter-wavelength', 'filter-transmission', 'filter-availability', 'filter-reset',
    'inventory-sort', 'inventory-body', 'result-count', 'stat-models', 'stat-total',
    'stat-available', 'stat-locations', 'last-updated', 'filter-chips', 'inventory-empty',
    'inventory-error', 'inventory-loading', 'inventory-export', 'inventory-dialog',
    'detail-close', 'inventory-pagination', 'page-prev', 'page-next', 'page-info',
    'empty-reset', 'inventory-demo-notice', 'demo-label', 'language-select',
    'detail-title', 'detail-subtitle', 'detail-body',
  ];
  const nodes = Object.fromEntries(ids.map(id => [id, new Element()]));
  nodes['inventory-app'].dataset.source = '/assets/data/inventory.json';
  const sidebarFilter = new Element('button'); sidebarFilter.dataset.category = 'Filter';
  const title = new Element('h1'); title.dataset.i18n = 'inventoryTitle';
  const placeholder = new Element('input'); placeholder.dataset.i18nPlaceholder = 'searchPlaceholder';
  const guideLink = new Element('a'); guideLink.dataset.hrefZh = '/guide/'; guideLink.dataset.hrefEn = '/en/guide/';
  const document = {
    querySelector: selector => selector === '#inventory-app' ? nodes['inventory-app'] : null,
    querySelectorAll: selector => ({ '[data-category]': [sidebarFilter], '[data-i18n]': [title],
      '[data-i18n-placeholder]': [placeholder], '[data-href-zh][data-href-en]': [guideLink] })[selector] || [],
    getElementById: id => nodes[id] || null,
    createElement: tagName => new Element(tagName),
    addEventListener() {}, body: new Element('body'), activeElement: null, documentElement: new Element('html'),
  };
  const events = new Map();
  const window = { location: new URL(`https://inventory.example.test/${search}`), addEventListener(name, listener) { events.set(name, listener); } };
  window.history = {
    pushState: (_state, _title, url) => { window.location = new URL(url, window.location); },
    replaceState: (_state, _title, url) => { window.location = new URL(url, window.location); },
  };
  const examples = [
    { id: 'BS-001', name: '示例分束镜', name_en: 'Sample beamsplitter', category: 'Beam splitter', model: 'DEMO-BS', wavelength_min_nm: 400, wavelength_max_nm: 700, transmission_pct: 50, aoi_deg: 0, quantity_available: 2 },
    { id: 'FL-001', name: '示例滤光片', name_en: 'Sample filter', category: 'Filter', model: 'DEMO-FL', wavelength_min_nm: 525, wavelength_max_nm: 540, transmission_pct: 90, quantity_available: 3 },
    { id: 'MR-001', name: '示例反射镜', name_en: 'Sample mirror', category: 'Mirror', model: 'DEMO-MR', wavelength_min_nm: 700, wavelength_max_nm: 1000, transmission_pct: null, quantity_available: 1 },
  ];
  const items = Array.from({ length: recordCount }, (_, index) => {
    const item = examples[index % examples.length];
    return { quantity_in_use: 0, quantity_loaned: 0, quantity_unavailable: 0,
      location: 'A柜', location_en: 'Cabinet A', owner: '管理员', owner_en: 'Manager',
      ...item, id: `${item.id}-${index}`, quantity_total: item.quantity_available };
  });
  const replacements = {
    document, window,
    Option: class extends Element { constructor(text, value) { super('option'); this.textContent = text; this.value = value; } },
    fetch: async () => ({ ok: true, json: async () => ({ schema_version: 1, is_demo: true, last_updated: '2026-11-14', items }) }),
  };
  const originals = Object.fromEntries(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  await import(`${moduleUrl(browserSource)}#instance=${instance++}`);
  await delay(0);
  assert.equal(nodes['result-count'].textContent, search.includes('lang=en') ? `Records: ${recordCount}` : `共 ${recordCount} 条记录`);
  return { nodes, window, sidebarFilter, title, placeholder, guideLink, document, events };
}

test('numeric input filters without blur or change, and empty results retain reset', async t => {
  const { nodes, window } = await mount(t);
  nodes['filter-wavelength'].value = '532';
  nodes['filter-wavelength'].dispatch('input');
  await delay(240);
  assert.equal(nodes['result-count'].textContent, '共 2 条记录');
  assert.equal(window.location.searchParams.get('wavelength'), '532');
  nodes['filter-transmission'].value = '99';
  nodes['filter-transmission'].dispatch('input');
  await delay(240);
  assert.equal(nodes['result-count'].textContent, '共 0 条记录');
  assert.equal(nodes['inventory-empty'].hidden, false);
  nodes['empty-reset'].dispatch('click');
  assert.equal(nodes['result-count'].textContent, '共 3 条记录');
  assert.equal(nodes['filter-wavelength'].value, '');
  assert.equal(nodes['filter-transmission'].value, '');
});

test('fast numeric entry survives immediate category and sidebar changes', async t => {
  const { nodes, window, sidebarFilter } = await mount(t);
  nodes['filter-wavelength'].value = '532'; nodes['filter-wavelength'].dispatch('input');
  nodes['filter-transmission'].value = '80'; nodes['filter-transmission'].dispatch('input');
  nodes['filter-category'].value = 'Filter'; nodes['filter-category'].dispatch('change');
  assert.equal(nodes['result-count'].textContent, '共 1 条记录');
  assert.equal(nodes['filter-wavelength'].value, '532');
  assert.equal(nodes['filter-transmission'].value, '80');
  assert.equal(window.location.searchParams.get('wavelength'), '532');
  assert.equal(window.location.searchParams.get('transmission'), '80');
  nodes['filter-reset'].dispatch('click');
  nodes['filter-transmission'].value = '99'; nodes['filter-transmission'].dispatch('input');
  sidebarFilter.dispatch('click');
  assert.equal(nodes['result-count'].textContent, '共 0 条记录');
  assert.equal(nodes['filter-transmission'].value, '99');
  await delay(240);
  assert.equal(nodes['result-count'].textContent, '共 0 条记录');
});

test('change submits numeric filters immediately and other controls preserve pending values', async t => {
  const { nodes } = await mount(t);
  for (const control of ['filter-location', 'filter-availability', 'inventory-sort']) {
    nodes['filter-reset'].dispatch('click');
    nodes['filter-transmission'].value = '80'; nodes['filter-transmission'].dispatch('input');
    if (control === 'filter-location') nodes[control].value = 'A柜';
    else if (control === 'filter-availability') nodes[control].checked = true;
    else nodes[control].value = 'available-desc';
    nodes[control].dispatch('change');
    assert.equal(nodes['result-count'].textContent, '共 1 条记录', control);
    assert.equal(nodes['filter-transmission'].value, '80', control);
  }
  nodes['filter-reset'].dispatch('click');
  nodes['filter-wavelength'].value = '750'; nodes['filter-wavelength'].dispatch('change');
  assert.equal(nodes['result-count'].textContent, '共 1 条记录');
  assert.equal(nodes['inventory-body'].children.length, 1);
});

test('language switch preserves page and original location values while translating labels and details', async t => {
  const { nodes, window, title, placeholder, guideLink, document } = await mount(t, { search: '?page=2', recordCount: 15 });
  assert.equal(nodes['inventory-body'].children.length, 5);
  nodes['language-select'].value = 'en'; nodes['language-select'].dispatch('change');
  assert.equal(nodes['result-count'].textContent, 'Records: 15');
  assert.equal(window.location.searchParams.get('page'), '2');
  assert.equal(window.location.searchParams.get('lang'), 'en');
  assert.equal(document.documentElement.attributes.get('lang'), 'en');
  assert.equal(title.textContent, 'Optical components');
  assert.equal(placeholder.attributes.get('placeholder'), 'Name, model, specifications, location');
  assert.equal(guideLink.attributes.get('href'), '/en/guide/');
  assert.equal(nodes['filter-location'].children[1].value, 'A柜');
  assert.equal(nodes['filter-location'].children[1].textContent, 'Cabinet A');
  const detailButton = nodes['inventory-body'].children[0].children[6].children[0];
  assert.equal(detailButton.textContent, 'Details'); detailButton.dispatch('click');
  assert.ok(nodes['detail-title'].textContent.startsWith('Sample'));
  assert.equal(nodes['detail-body'].children[0].children[0].textContent, 'Basic information');
  nodes['language-select'].value = 'zh'; nodes['language-select'].dispatch('change');
  assert.equal(nodes['detail-body'].children[0].children[0].textContent, '基本信息');
  assert.equal(window.location.searchParams.get('page'), '2');
});

test('English URL initializes and browser history restores language without clearing filters', async t => {
  const { nodes, window, title, events } = await mount(t, { search: '?lang=en' });
  assert.equal(nodes['language-select'].value, 'en');
  nodes['filter-wavelength'].value = '532'; nodes['filter-wavelength'].dispatch('change');
  nodes['filter-reset'].dispatch('click');
  assert.equal(nodes['language-select'].value, 'en');
  assert.equal(window.location.searchParams.get('lang'), 'en');
  window.location = new URL('https://inventory.example.test/?wavelength=532'); events.get('popstate')();
  assert.equal(nodes['result-count'].textContent, '共 2 条记录');
  assert.equal(nodes['filter-wavelength'].value, '532');
  assert.equal(nodes['language-select'].value, 'zh');
  assert.equal(title.textContent, '光学元件');
});

test('details show applicable optical fields, retain known zero and use one unknown fallback', async t => {
  const { nodes } = await mount(t, { search: '?lang=en' });
  const beamRow = nodes['inventory-body'].children.find(row => row.children[1].children[0].textContent === 'Beam splitter');
  beamRow.children[6].children[0].dispatch('click');
  const specs = nodes['detail-body'].children[1].children[1].children;
  assert.deepEqual(specs.map(pair => pair.children[0].textContent), ['Transmission T', 'Angle of incidence AOI']);
  assert.equal(specs[1].children[1].textContent, '0°');
  nodes['detail-close'].dispatch('click');
  const mirrorRow = nodes['inventory-body'].children.find(row => row.children[1].children[0].textContent === 'Mirror');
  mirrorRow.children[6].children[0].dispatch('click');
  const fallback = nodes['detail-body'].children[1].children[1].children;
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0].children[0].textContent, 'Parameters');
  assert.equal(fallback[0].children[1].textContent, 'Unknown');
});
