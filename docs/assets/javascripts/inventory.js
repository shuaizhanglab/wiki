import {
  CATEGORIES, parseQuery, serializeQuery, filterItems, sortItems,
  aggregateInventory, formatNumber, summarySpecs, exportCsv, translate,
  localizedField, categoryLabel, polarizationLabel, numeric,
} from './inventory-core.js';

const app = document.querySelector('#inventory-app');
if (app) initialize(app);

function initialize(root) {
  const $ = id => document.getElementById(id);
  const controls = {
    q: $('inventory-search'), category: $('filter-category'), location: $('filter-location'),
    wavelength: $('filter-wavelength'), transmission: $('filter-transmission'),
    available: $('filter-availability'), sort: $('inventory-sort'),
  };
  let state = parseQuery(window.location.search), items = [], filtered = [], lastTrigger = null;
  let hasLoaded = false;
  let knownLocations = new Set();
  let inputTimer = null;
  let appliedLanguage = null, loadState = 'loading', activeDetail = null;
  const PAGE_SIZE = 10;
  const dialog = $('inventory-dialog');
  const setText = (id, value) => { if ($(id)) $(id).textContent = String(value); };
  const show = (id, visible) => { if ($(id)) $(id).hidden = !visible; };
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const t = (key, values) => translate(state.lang, key, values);
  const field = (item, key) => localizedField(item, key, state.lang);
  const format = (value, unit = '') => formatNumber(value, unit, state.lang);

  function locationLabel(value) {
    const record = items.find(item => item.location === value && item.location_en?.trim())
      || items.find(item => item.location === value);
    return record ? field(record, 'location') : value;
  }

  function renderFilterOptions() {
    controls.category?.replaceChildren(new Option(t('allTypes'), ''), ...CATEGORIES.map(category => new Option(categoryLabel(category, state.lang), category)));
    const availableLocations = new Set(knownLocations);
    if (loadState === 'loading' && state.location) availableLocations.add(state.location);
    const locations = [...availableLocations].sort((a, b) => locationLabel(a).localeCompare(locationLabel(b), state.lang === 'en' ? 'en' : 'zh-CN'));
    controls.location?.replaceChildren(new Option(t('allLocations'), ''), ...locations.map(location => new Option(locationLabel(location), location)));
    controls.sort?.replaceChildren(new Option(t('sortName'), 'name'), new Option(t('sortCategory'), 'category'), new Option(t('sortAvailable'), 'available-desc'));
  }

  function applyTranslations() {
    if (appliedLanguage === state.lang) return;
    appliedLanguage = state.lang;
    document.documentElement?.setAttribute('lang', state.lang === 'en' ? 'en' : 'zh-CN');
    document.title = t('pageTitle');
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    for (const [selector, attribute, datasetKey] of [
      ['[data-i18n-placeholder]', 'placeholder', 'i18nPlaceholder'],
      ['[data-i18n-title]', 'title', 'i18nTitle'],
      ['[data-i18n-aria-label]', 'aria-label', 'i18nAriaLabel'],
    ]) document.querySelectorAll(selector).forEach(node => node.setAttribute(attribute, t(node.dataset[datasetKey])));
    document.querySelectorAll('[data-href-zh][data-href-en]').forEach(node => {
      node.setAttribute('href', state.lang === 'en' ? node.dataset.hrefEn : node.dataset.hrefZh);
    });
    renderFilterOptions();
    if ($('language-select')) $('language-select').value = state.lang;
    if (loadState === 'loading') setText('result-count', t('loading'));
    if (loadState === 'error') renderError();
  }

  function syncControls() {
    applyTranslations();
    for (const [key, element] of Object.entries(controls)) {
      if (!element) continue;
      if (key === 'available') element.checked = state.available;
      else element.value = state[key] ?? '';
    }
    document.querySelectorAll('[data-category]').forEach(button => {
      const active = (button.dataset.category || '') === state.category;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function writeUrl(mode = 'push') {
    const query = serializeQuery(state);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history[mode === 'replace' ? 'replaceState' : 'pushState'](null, '', url);
    }
  }

  function readControls() {
    // Read every current input, including values whose debounce has not fired yet.
    return {
      q: controls.q?.value || '',
      category: controls.category?.value || '',
      location: controls.location?.value || '',
      wavelength: parseQuery(`wavelength=${encodeURIComponent(controls.wavelength?.value || '')}`).wavelength,
      transmission: parseQuery(`transmission=${encodeURIComponent(controls.transmission?.value || '')}`).transmission,
      available: Boolean(controls.available?.checked),
      sort: controls.sort?.value || 'name',
    };
  }

  function update(patch, mode = 'push') {
    clearTimeout(inputTimer);
    const next = { ...state, ...readControls(), ...patch };
    const changed = Object.keys(controls).some(key => next[key] !== state[key]);
    state = next;
    if (changed) state.page = 1;
    syncControls();
    render();
    if (activeDetail && dialog?.open) openDetail(activeDetail);
    writeUrl(mode);
  }

  function render() {
    // Controls may change while fetch is pending; keep the loading/error view intact.
    if (!hasLoaded) return;
    filtered = sortItems(filterItems(items, state), state.sort, state.lang);
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), pages);
    const start = (state.page - 1) * PAGE_SIZE;
    const body = $('inventory-body');
    body.replaceChildren(...filtered.slice(start, start + PAGE_SIZE).map(renderRow));
    setText('result-count', t('recordCount', { count: filtered.length }));
    setText('page-info', filtered.length ? t('pageRange', { start: start + 1, end: Math.min(start + PAGE_SIZE, filtered.length), count: filtered.length }) : t('noRecords'));
    if ($('page-prev')) $('page-prev').disabled = state.page <= 1;
    if ($('page-next')) $('page-next').disabled = state.page >= pages;
    if ($('inventory-export')) $('inventory-export').disabled = filtered.length === 0;
    show('inventory-empty', filtered.length === 0);
    show('inventory-pagination', filtered.length > 0);
    renderChips();
    root.setAttribute('aria-busy', 'false');
  }

  function renderRow(item) {
    const row = make('tr', 'inventory-row');
    const identity = make('td', 'item-identity');
    const identityWrap = make('div', 'item-identity-wrap');
    const info = make('div', 'item-info');
    info.append(make('span', 'item-name', field(item, 'name')), make('span', 'item-model', `${item.id} · ${item.model || t('unknownModel')}`));
    identityWrap.append(info); identity.append(identityWrap);

    const category = make('td', 'item-category');
    category.append(make('span', 'category-label', categoryLabel(item.category, state.lang)), make('span', 'cell-secondary', field(item, 'subtype') || item.category));
    const specs = make('td', 'item-specs');
    const [primary, secondary] = summarySpecs(item, state.lang);
    specs.append(make('span', 'spec-primary', primary), make('span', 'cell-secondary', secondary));
    const stock = make('td', 'item-stock');
    const count = make('div', 'stock-count');
    count.append(make('strong', item.quantity_available > 0 ? 'stock-available' : 'stock-zero', item.quantity_available), make('span', 'stock-denominator', ` / ${item.quantity_total}`));
    stock.append(count);
    const location = make('td', 'item-location');
    location.append(make('span', 'location-primary', field(item, 'location') || t('unknownLocation')), make('span', 'cell-secondary', field(item, 'owner') || t('unknownOwner')));
    const status = make('td', 'item-status');
    const statusClass = item.quantity_available > 0 ? 'available' : 'unavailable';
    status.append(make('span', `status-badge status-badge--${statusClass}`, t(item.quantity_available > 0 ? 'available' : 'unavailable')));
    const actions = make('td', 'item-action');
    const button = make('button', 'detail-button', t('details'));
    button.type = 'button'; button.setAttribute('aria-label', t('viewDetails', { name: field(item, 'name') }));
    button.addEventListener('click', () => openDetail(item, button));
    actions.append(button);
    row.append(identity, category, specs, stock, location, status, actions);
    return row;
  }

  function renderChips() {
    const target = $('filter-chips');
    if (!target) return;
    const chips = [];
    const labels = [
      ['q', state.q?.trim() ? t('searchChip', { query: state.q.trim() }) : ''],
      ['category', state.category ? categoryLabel(state.category, state.lang) : ''],
      ['location', state.location ? locationLabel(state.location) : ''],
      ['wavelength', state.wavelength !== null ? `${state.wavelength} nm` : ''],
      ['transmission', state.transmission !== null ? `T ≥ ${state.transmission}%` : ''],
      ['available', state.available ? t('availableOnly') : ''],
    ];
    labels.forEach(([key, label]) => {
      if (!label) return;
      const chip = make('button', 'filter-chip', `${label} ×`);
      chip.type = 'button'; chip.setAttribute('aria-label', t('removeFilter', { label }));
      chip.addEventListener('click', () => update({ [key]: key === 'available' ? false : ['wavelength', 'transmission'].includes(key) ? null : '' }));
      chips.push(chip);
    });
    target.replaceChildren(...chips);
    target.hidden = chips.length === 0;
  }

  function openDetail(item, trigger) {
    if (!dialog) return;
    activeDetail = item;
    if (trigger) lastTrigger = trigger;
    setText('detail-title', field(item, 'name'));
    setText('detail-subtitle', `${item.id} · ${categoryLabel(item.category, state.lang)} · ${item.model || t('unknownModel')}`);
    const content = $('detail-body');
    const opticalPairs = [
      [t('transmission'), format(item.transmission_pct, '%'), numeric(item.transmission_pct) !== null],
      [t('reflection'), format(item.reflection_pct, '%'), numeric(item.reflection_pct) !== null],
      [t('splitRatio'), item.split_ratio, Boolean(item.split_ratio?.trim())],
      [t('centerWavelength'), format(item.center_wavelength_nm, ' nm'), numeric(item.center_wavelength_nm) !== null],
      [t('bandwidth'), format(item.bandwidth_nm, ' nm'), numeric(item.bandwidth_nm) !== null],
      [t('cutoff'), format(item.cutoff_wavelength_nm, ' nm'), numeric(item.cutoff_wavelength_nm) !== null],
      [t('opticalDensity'), format(item.optical_density), numeric(item.optical_density) !== null],
      [t('aoi'), format(item.aoi_deg, '°'), numeric(item.aoi_deg) !== null],
      [t('polarization'), polarizationLabel(item.polarization, state.lang), Boolean(item.polarization?.trim())],
    ].filter(([, , known]) => known).map(([label, value]) => [label, value]);
    if (!opticalPairs.length) opticalPairs.push([t('parameters'), t('unknown')]);
    const sections = [
      [t('basicInfo'), [
        [t('componentType'), `${categoryLabel(item.category, state.lang)} / ${field(item, 'subtype') || t('unknown')}`],
        [t('brand'), item.brand || t('unknown')], [t('model'), item.model || t('unknown')],
        [t('wavelengthRange'), summarySpecs(item, state.lang)[1]], [t('diameter'), format(item.diameter_mm, ' mm')],
      ]],
      [t('opticalSpecs'), opticalPairs],
      [t('stockLocation'), [
        [t('total'), t('quantity', { count: item.quantity_total })], [t('availableStock'), t('quantity', { count: item.quantity_available })],
        [t('inUse'), t('quantity', { count: item.quantity_in_use })], [t('loaned'), t('quantity', { count: item.quantity_loaned })],
        [t('unavailableStock'), t('quantity', { count: item.quantity_unavailable })], [t('storageLocation'), field(item, 'location') || t('unknown')],
        [t('owner'), field(item, 'owner') || t('unknown')], [t('verifiedOn'), item.verified_on || t('unknown')],
      ]],
    ];
    const nodes = sections.map(([heading, pairs]) => {
      const section = make('section', 'detail-section');
      section.append(make('h3', '', heading));
      const list = make('dl', 'detail-grid');
      pairs.forEach(([label, value]) => { const pair = make('div', 'detail-pair'); pair.append(make('dt', '', label), make('dd', '', value)); list.append(pair); });
      section.append(list); return section;
    });
    const notes = make('section', 'detail-section');
    notes.append(make('h3', '', t('resourcesNotes')), make('p', 'detail-note', field(item, 'notes') || t('noNotes')));
    if (item.datasheet_url) {
      try {
        const url = new URL(item.datasheet_url, window.location.href);
        const relative = !/^[a-z][a-z\d+.-]*:/i.test(item.datasheet_url) && !item.datasheet_url.startsWith('//');
        if (url.protocol === 'https:' || (relative && url.origin === window.location.origin)) {
          const link = make('a', 'datasheet-link', t('viewDatasheet'));
          link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
          notes.append(link);
        }
      } catch { /* Untrusted links remain plain data. */ }
    }
    if (item.is_demo) notes.append(make('p', 'demo-detail-notice', t('demo')));
    nodes.push(notes); content.replaceChildren(...nodes);
    if (!dialog.open) {
      dialog.showModal();
      $('detail-close')?.focus();
    }
  }

  function closeDetail() { if (dialog?.open) dialog.close(); }
  $('detail-close')?.addEventListener('click', closeDetail);
  dialog?.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDetail();
  } });
  dialog?.addEventListener('close', () => {
    activeDetail = null;
    if (lastTrigger?.isConnected !== false) lastTrigger?.focus();
    else controls.q?.focus();
    lastTrigger = null;
  });

  for (const [key, control] of Object.entries(controls)) {
    if (!control) continue;
    const handler = () => update({});
    if (['q', 'wavelength', 'transmission'].includes(key)) {
      control.addEventListener('input', () => {
        clearTimeout(inputTimer);
        inputTimer = setTimeout(handler, key === 'q' ? 140 : 200);
      });
    }
    control.addEventListener('change', handler);
  }
  $('language-select')?.addEventListener('change', () => update({ lang: $('language-select').value === 'en' ? 'en' : 'zh', page: state.page }));
  $('filter-reset')?.addEventListener('click', () => { clearTimeout(inputTimer); update({ ...parseQuery(''), lang: state.lang }); });
  $('empty-reset')?.addEventListener('click', () => update({ ...parseQuery(''), lang: state.lang }));
  $('page-prev')?.addEventListener('click', () => update({ page: state.page - 1 }));
  $('page-next')?.addEventListener('click', () => update({ page: state.page + 1 }));
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => update({ category: button.dataset.category || '' })));
  $('inventory-export')?.addEventListener('click', () => {
    if (!filtered.length) return;
    const blob = new Blob([exportCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), anchor = make('a');
    anchor.href = url; anchor.download = `optics-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('popstate', () => {
    clearTimeout(inputTimer);
    state = parseQuery(window.location.search);
    if (hasLoaded && state.location && !knownLocations.has(state.location)) state.location = '';
    syncControls(); render();
    if (activeDetail && dialog?.open) openDetail(activeDetail);
    writeUrl('replace');
  });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !dialog?.open && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
      event.preventDefault(); controls.q?.focus();
    }
  });

  root.setAttribute('aria-busy', 'true');
  syncControls();
  if ($('inventory-export')) $('inventory-export').disabled = true;
  fetch(root.dataset.source, { credentials: 'same-origin' }).then(async response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.schema_version !== 1 || !Array.isArray(data.items)) throw new Error('数据格式不受支持');
    items = data.items;
    const locations = [...new Set(items.map(item => item.location).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    knownLocations = new Set(locations);
    if (state.location && !locations.includes(state.location)) state.location = '';
    loadState = 'ready';
    renderFilterOptions();
    const totals = aggregateInventory(items);
    setText('stat-models', totals.models); setText('stat-total', totals.total);
    setText('stat-available', totals.available); setText('stat-locations', totals.locations);
    setText('last-updated', data.last_updated || t('unknown'));
    document.querySelectorAll('[data-category-count]').forEach(node => {
      node.textContent = node.dataset.categoryCount ? totals.categories[node.dataset.categoryCount] || 0 : totals.records;
    });
    show('inventory-demo-notice', Boolean(data.is_demo));
    show('demo-label', Boolean(data.is_demo));
    show('inventory-loading', false); show('inventory-error', false);
    hasLoaded = true;
    syncControls(); render(); writeUrl('replace');
  }).catch(error => {
    loadState = 'error';
    root.setAttribute('aria-busy', 'false');
    show('inventory-loading', false); show('inventory-empty', false); show('inventory-pagination', false);
    renderError();
    console.error('Inventory data could not be loaded:', error);
  });

  function renderError() {
    setText('result-count', t('errorTitle'));
    const target = $('inventory-error');
    if (target) {
      target.hidden = false;
      const message = target.querySelector('[data-error-message]');
      const text = t('errorMessage');
      if (message) message.textContent = text;
      else target.textContent = text;
    }
  }
}
