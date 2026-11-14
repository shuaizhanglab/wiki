import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// .js is deliberately usable as a browser module without requiring Node package configuration.
const source = await readFile(new URL('../docs/assets/javascripts/inventory-core.js', import.meta.url), 'utf8');
const core = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { parseQuery, serializeQuery, filterItems, sortItems, aggregateInventory, formatNumber, summarySpecs, csvCell, exportCsv, CSV_FIELDS, translations, translate, localizedField, categoryLabel } = core;

const base = {
  id: 'BS-001', name: '宽带分束镜', category: 'Beam splitter', subtype: '非偏振',
  brand: '演示', model: 'DEMO-BS-01', wavelength_min_nm: 400, wavelength_max_nm: 700,
  diameter_mm: 25.4, transmission_pct: 50, reflection_pct: 50, split_ratio: '50:50',
  center_wavelength_nm: null, bandwidth_nm: null, cutoff_wavelength_nm: null,
  optical_density: null, aoi_deg: 45, polarization: '非偏振', quantity_available: 3,
  quantity_in_use: 2, quantity_loaned: 0, quantity_unavailable: 1, quantity_total: 6,
  location: '101 / A柜 / 2层', owner: '示例负责人', datasheet_url: '', notes: '演示数据',
  verified_on: '2026-11-14', is_demo: true,
};
const items = [
  base,
  { ...base, id: 'FL-001', name: '带通滤光片', model: 'DEMO-FL-01', category: 'Filter', subtype: '带通', wavelength_min_nm: 525, wavelength_max_nm: 539, transmission_pct: 90, center_wavelength_nm: 532, bandwidth_nm: 14, split_ratio: '', quantity_available: 0, quantity_in_use: 2, quantity_unavailable: 0, quantity_total: 2, location: '102 / B柜 / 1层' },
  { ...base, id: 'FL-002', name: '参数待确认滤光片', model: 'DEMO-FL-02', category: 'Filter', subtype: '', wavelength_min_nm: null, wavelength_max_nm: null, transmission_pct: null, reflection_pct: null, split_ratio: '', quantity_available: 1, quantity_in_use: 0, quantity_unavailable: 0, quantity_total: 1 },
];
const state = patch => ({ ...parseQuery(''), ...patch });

test('wavelength and transmission filters include exact boundaries and exclude unknown values', () => {
  assert.deepEqual(filterItems(items, state({ wavelength: 400 })).map(item => item.id), ['BS-001']);
  assert.deepEqual(filterItems(items, state({ wavelength: 700 })).map(item => item.id), ['BS-001']);
  assert.equal(filterItems(items, state({ wavelength: 701 })).length, 0);
  assert.deepEqual(filterItems(items, state({ transmission: 90 })).map(item => item.id), ['FL-001']);
  assert.equal(filterItems(items, state({ transmission: 91 })).length, 0);
  assert.equal(filterItems(items, state({ transmission: 0 })).length, 2);
  assert.equal(filterItems(items, state({})).length, 3);
});

test('filters compose with AND semantics across type, location, wavelength and availability', () => {
  assert.deepEqual(filterItems(items, state({ category: 'Filter', wavelength: 532 })).map(item => item.id), ['FL-001']);
  assert.equal(filterItems(items, state({ category: 'Filter', wavelength: 532, available: true })).length, 0);
  assert.deepEqual(filterItems(items, state({ location: base.location, available: true })).map(item => item.id), ['BS-001', 'FL-002']);
});

test('search supports Chinese labels, mixed-case identifiers and AND-separated tokens', () => {
  assert.deepEqual(filterItems(items, state({ q: 'BS demo-bs-01 25.4' })).map(item => item.id), ['BS-001']);
  assert.equal(filterItems(items, state({ q: '分束镜 102' })).length, 0);
  assert.deepEqual(filterItems(items, state({ q: '滤光片 102' })).map(item => item.id), ['FL-001']);
  assert.equal(filterItems(items, state({ q: '  ' })).length, 3);
  assert.deepEqual(filterItems(items, state({ q: '５０：５０' })).map(item => item.id), ['BS-001']);
});

test('sort is deterministic and does not mutate source items', () => {
  const input = [items[1], items[2], items[0]];
  assert.deepEqual(sortItems(input, 'available-desc').map(item => item.quantity_available), [3, 1, 0]);
  assert.equal(input[0].id, 'FL-001');
  assert.equal(sortItems(input, 'category')[0].category, 'Beam splitter');
});

test('aggregate distinguishes model count, stock records, locations and physical units', () => {
  const duplicateModel = { ...base, id: 'BS-002', location: '103 / C柜', quantity_total: 2, quantity_available: 2 };
  const summary = aggregateInventory([...items, duplicateModel]);
  assert.equal(summary.models, 3);
  assert.equal(summary.records, 4);
  assert.equal(summary.total, 11);
  assert.equal(summary.available, 6);
  assert.equal(summary.locations, 3);
  assert.equal(summary.categories.Filter, 2);
  const withoutTotal = { ...base }; delete withoutTotal.quantity_total;
  assert.equal(aggregateInventory([withoutTotal]).total, 6);
  assert.deepEqual(aggregateInventory([]).models, 0);
});

test('query parsing rejects invalid values without treating absence as zero', () => {
  assert.equal(parseQuery('').lang, 'zh');
  assert.equal(parseQuery('?lang=en').lang, 'en');
  assert.equal(parseQuery('?lang=unsupported').lang, 'zh');
  assert.equal(parseQuery('').transmission, null);
  assert.equal(parseQuery('?transmission=0').transmission, 0);
  assert.equal(parseQuery('?transmission=101').transmission, null);
  assert.equal(parseQuery('?wavelength=-532').wavelength, null);
  assert.equal(parseQuery('?wavelength=Infinity').wavelength, null);
  assert.equal(parseQuery('?category=unknown&sort=unsafe&page=1.5').page, 1);
  assert.equal(parseQuery('?category=unknown').category, '');
  assert.equal(parseQuery('?page=9007199254740992').page, 1);
  assert.equal(parseQuery('?available=true').available, false);
  assert.equal(parseQuery('?available=1').available, true);
});

test('query round-trips Chinese locations, zero percent and paging', () => {
  const expected = state({ lang: 'en', q: 'DEMO 532', category: 'Filter', location: '101 / A柜 / 2层', wavelength: 532, transmission: 0, available: true, sort: 'available-desc', page: 2 });
  assert.deepEqual(parseQuery(serializeQuery(expected)), expected);
  assert.equal(serializeQuery(state({})), '');
});

test('CSV export preserves quotes, commas, newlines and protects spreadsheet formula execution', () => {
  assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"');
  for (const dangerous of ['=1+2', '+SUM(A1)', '-1+2', '@SUM(A1)', ' \t=HYPERLINK("x")', '\t=1', '\r=1']) {
    assert.ok(csvCell(dangerous).startsWith('"\''), dangerous);
  }
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(0), '"0"');
  const csv = exportCsv([{ ...base, notes: '=HYPERLINK("https://example.test")' }]);
  assert.ok(csv.startsWith(`\uFEFF${CSV_FIELDS.join(',')}\r\n`));
  assert.ok(csv.endsWith('\r\n'));
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.test"")"'));
  assert.ok(!CSV_FIELDS.includes('quantity_total'), 'export remains compatible with the editable CSV schema');
  for (const field of ['name_en', 'subtype_en', 'location_en', 'owner_en', 'notes_en']) assert.ok(CSV_FIELDS.includes(field));
});

test('display treats zero as known and null as unknown', () => {
  assert.equal(formatNumber(0, '%'), '0%');
  assert.equal(formatNumber(null, '%'), '待确认');
  assert.ok(summarySpecs(base)[0].includes('R:T 50:50'));
  assert.ok(summarySpecs(items[1])[0].includes('CWL 532 nm'));
  assert.ok(summarySpecs({ ...items[2], reflection_pct: 99 })[0].includes('R 99%'));
  assert.equal(summarySpecs(items[2])[1], '波段待确认');
});

test('language dictionaries are complete and translated fields fall back to original stock data', () => {
  assert.deepEqual(Object.keys(translations.zh).sort(), Object.keys(translations.en).sort());
  assert.equal(translate('en', 'recordCount', { count: 3 }), 'Records: 3');
  assert.equal(categoryLabel('Beam splitter', 'en'), 'Beam splitter');
  assert.equal(localizedField({ name: '分束镜', name_en: 'Beamsplitter' }, 'name', 'en'), 'Beamsplitter');
  assert.equal(localizedField({ name: '分束镜', name_en: '' }, 'name', 'en'), '分束镜');
  assert.equal(formatNumber(null, '%', 'en'), 'Unknown');
  assert.equal(summarySpecs(items[2], 'en')[1], 'Wavelength unknown');
});

test('search matches both language fields and export retains untranslated source records', () => {
  const bilingual = { ...base, name_en: 'Broadband beamsplitter', location_en: 'Cabinet A' };
  assert.equal(filterItems([bilingual], state({ lang: 'zh', q: 'broadband cabinet' })).length, 1);
  assert.equal(filterItems([bilingual], state({ lang: 'en', q: '宽带分束镜' })).length, 1);
  const csv = exportCsv([bilingual]);
  assert.ok(csv.includes('"宽带分束镜"'));
  assert.ok(csv.includes('"Broadband beamsplitter"'));
});
