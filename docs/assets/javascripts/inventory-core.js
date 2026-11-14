/** Pure inventory operations shared by the browser and the Node test suite. */
export const CATEGORIES = ['Beam splitter', 'Filter', 'Mirror', 'Lens', 'Waveplate', 'Polarizer'];
export const CATEGORY_LABELS = {
  'Beam splitter': '分束镜', Filter: '滤光片', Mirror: '反射镜',
  Lens: '透镜', Waveplate: '波片', Polarizer: '偏振片',
};
export const translations = {
  zh: {
    appName: '库存目录', pageTitle: '光学元件 · 库存目录', inventoryTitle: '光学元件',
    allItems: '全部元件', categories: '分类', documents: '文档', guide: '使用指南',
    schema: '字段说明', maintenance: '维护与发布', about: '关于',
    exportCsv: '导出结果', downloadCsv: '下载 CSV', language: '语言',
    searchLabel: '搜索', searchPlaceholder: '名称、型号、参数、位置', typeLabel: '类型',
    locationLabel: '位置', wavelengthLabel: '波长 (nm)', transmissionLabel: '最低透过率 (%)',
    availableOnly: '仅看可用', reset: '重置', sortLabel: '排序', sortName: '名称',
    sortCategory: '类型', sortAvailable: '可用数量', columnItem: '元件', columnType: '类型',
    columnSpecs: '参数', columnStock: '可用 / 总量', columnLocation: '位置', columnStatus: '状态',
    columnActions: '操作', emptyTitle: '无匹配元件', loading: '加载中…', retry: '重试',
    previous: '上一页', next: '下一页', close: '关闭', demo: '示例数据',
    demoNotice: '示例台账，请替换为实际库存。', lastUpdated: '最近核对', modelCount: '型号',
    totalCount: '总量', availableCount: '可用', locationCount: '位置', skipContent: '跳到内容',
    tableCaption: '光学元件库存', mobileMenu: '目录', horizontalScroll: '左右滑动查看表格',
    pagination: '分页', filters: '筛选条件', parameters: '参数',
    errorTitle: '加载失败', errorMessage: '库存加载失败，请重试。', allTypes: '全部类型',
    allLocations: '全部位置', recordCount: '共 {count} 条记录', pageRange: '{start}–{end} / {count} 条',
    noRecords: '0 条记录', unknown: '待确认', unknownModel: '型号待确认', unknownLocation: '位置待确认',
    unknownOwner: '负责人待确认', unknownWavelength: '波段待确认', unknownSpecs: '参数待确认',
    availableTotal: '可用 / 总量', available: '可取用', unavailable: '暂无可用', details: '详情',
    viewDetails: '查看{name}详情', searchChip: '搜索：{query}', removeFilter: '移除筛选：{label}',
    basicInfo: '基本信息', componentType: '元件类型', brand: '品牌', model: '型号',
    wavelengthRange: '适用波段', diameter: '直径', opticalSpecs: '光学参数',
    transmission: '透过率 T', reflection: '反射率 R', splitRatio: '分光比 R:T',
    centerWavelength: '中心波长 CWL', bandwidth: '带宽 FWHM', cutoff: '截止波长',
    opticalDensity: '光密度 OD', aoi: '入射角 AOI', polarization: '偏振条件',
    stockLocation: '库存与位置', total: '总量', availableStock: '可用', inUse: '在用',
    loaned: '借出', unavailableStock: '待检 / 损坏', storageLocation: '存放位置', owner: '负责人',
    verifiedOn: '最近核对', quantity: '{count} 件', resourcesNotes: '资料与备注',
    noNotes: '—', viewDatasheet: '规格书 ↗', cutoffShort: '截止',
    categoryBeamSplitter: '分束镜', categoryFilter: '滤光片', categoryMirror: '反射镜',
    categoryLens: '透镜', categoryWaveplate: '波片', categoryPolarizer: '偏振片',
  },
  en: {
    appName: 'Inventory', pageTitle: 'Optical components · Inventory', inventoryTitle: 'Optical components',
    allItems: 'All components', categories: 'Categories', documents: 'Documents', guide: 'User guide',
    schema: 'CSV fields', maintenance: 'Maintenance & deployment', about: 'About',
    exportCsv: 'Export results', downloadCsv: 'Download CSV', language: 'Language',
    searchLabel: 'Search', searchPlaceholder: 'Name, model, specifications, location', typeLabel: 'Type',
    locationLabel: 'Location', wavelengthLabel: 'Wavelength (nm)', transmissionLabel: 'Minimum transmission (%)',
    availableOnly: 'Available only', reset: 'Reset', sortLabel: 'Sort', sortName: 'Name',
    sortCategory: 'Type', sortAvailable: 'Available quantity', columnItem: 'Component', columnType: 'Type',
    columnSpecs: 'Specifications', columnStock: 'Available / total', columnLocation: 'Location', columnStatus: 'Status',
    columnActions: 'Actions', emptyTitle: 'No matching components', loading: 'Loading…', retry: 'Retry',
    previous: 'Previous', next: 'Next', close: 'Close', demo: 'Sample data',
    demoNotice: 'Sample inventory. Replace with actual stock.', lastUpdated: 'Last verified', modelCount: 'Models',
    totalCount: 'Total', availableCount: 'Available', locationCount: 'Locations', skipContent: 'Skip to content',
    tableCaption: 'Optical component inventory', mobileMenu: 'Contents', horizontalScroll: 'Scroll horizontally to view the table',
    pagination: 'Pagination', filters: 'Filters', parameters: 'Parameters',
    errorTitle: 'Unable to load inventory', errorMessage: 'Could not load inventory. Try again.', allTypes: 'All types',
    allLocations: 'All locations', recordCount: 'Records: {count}', pageRange: '{start}–{end} of {count}',
    noRecords: '0 records', unknown: 'Unknown', unknownModel: 'Model unknown', unknownLocation: 'Location unknown',
    unknownOwner: 'Owner unknown', unknownWavelength: 'Wavelength unknown', unknownSpecs: 'Specifications unknown',
    availableTotal: 'Available / total', available: 'Available', unavailable: 'Unavailable', details: 'Details',
    viewDetails: 'View details for {name}', searchChip: 'Search: {query}', removeFilter: 'Remove filter: {label}',
    basicInfo: 'Basic information', componentType: 'Component type', brand: 'Brand', model: 'Model',
    wavelengthRange: 'Wavelength range', diameter: 'Diameter', opticalSpecs: 'Optical specifications',
    transmission: 'Transmission T', reflection: 'Reflectance R', splitRatio: 'Split ratio R:T',
    centerWavelength: 'Center wavelength CWL', bandwidth: 'Bandwidth FWHM', cutoff: 'Cutoff wavelength',
    opticalDensity: 'Optical density OD', aoi: 'Angle of incidence AOI', polarization: 'Polarization',
    stockLocation: 'Stock & location', total: 'Total', availableStock: 'Available', inUse: 'In use',
    loaned: 'On loan', unavailableStock: 'Inspection / damaged', storageLocation: 'Storage location', owner: 'Owner',
    verifiedOn: 'Last verified', quantity: '{count} pcs', resourcesNotes: 'Resources & notes',
    noNotes: '—', viewDatasheet: 'Datasheet ↗', cutoffShort: 'Cutoff',
    categoryBeamSplitter: 'Beam splitter', categoryFilter: 'Filter', categoryMirror: 'Mirror',
    categoryLens: 'Lens', categoryWaveplate: 'Waveplate', categoryPolarizer: 'Polarizer',
  },
};

export function translate(lang, key, values = {}) {
  const text = translations[lang]?.[key] ?? translations.zh[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
}

export function localizedField(item, field, lang = 'zh') {
  const english = item[`${field}_en`];
  return lang === 'en' && typeof english === 'string' && english.trim() ? english : item[field];
}

export function categoryLabel(category, lang = 'zh') {
  return lang === 'en' ? category : CATEGORY_LABELS[category] || category;
}

export function polarizationLabel(value, lang = 'zh') {
  if (!value) return translate(lang, 'unknown');
  if (lang !== 'en') return value;
  return ({ '非偏振': 'Non-polarizing', '线偏振': 'Linear', '圆偏振': 'Circular',
    '任意': 'Any', '未偏振': 'Unpolarized', '水平': 'Horizontal', '垂直': 'Vertical',
    's偏振': 's-polarized', 'p偏振': 'p-polarized' })[value] || value;
}
export const CSV_FIELDS = [
  'id', 'name', 'category', 'subtype', 'brand', 'model', 'wavelength_min_nm',
  'wavelength_max_nm', 'diameter_mm', 'transmission_pct', 'reflection_pct',
  'split_ratio', 'center_wavelength_nm', 'bandwidth_nm', 'cutoff_wavelength_nm',
  'optical_density', 'aoi_deg', 'polarization', 'quantity_available',
  'quantity_in_use', 'quantity_loaned', 'quantity_unavailable', 'location',
  'owner', 'datasheet_url', 'notes', 'verified_on', 'is_demo',
  'name_en', 'subtype_en', 'location_en', 'owner_en', 'notes_en',
];
const SORTS = ['name', 'category', 'available-desc'];
const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim();
const present = value => value !== null && value !== undefined && value !== '';
export const numeric = value => present(value) && Number.isFinite(Number(value)) ? Number(value) : null;
const positive = value => { const n = numeric(value); return n !== null && n > 0 ? n : null; };
const percent = value => { const n = numeric(value); return n !== null && n >= 0 && n <= 100 ? n : null; };

export function parseQuery(search = '') {
  const p = new URLSearchParams(search);
  const page = Number(p.get('page'));
  return {
    lang: p.get('lang') === 'en' ? 'en' : 'zh',
    q: (p.get('q') || '').slice(0, 500),
    category: CATEGORIES.includes(p.get('category')) ? p.get('category') : '',
    location: (p.get('location') || '').slice(0, 300),
    wavelength: positive(p.get('wavelength')),
    transmission: percent(p.get('transmission')),
    available: p.get('available') === '1',
    sort: SORTS.includes(p.get('sort')) ? p.get('sort') : 'name',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function serializeQuery(state) {
  const p = new URLSearchParams();
  if (state.lang === 'en') p.set('lang', 'en');
  if (state.q?.trim()) p.set('q', state.q.trim());
  if (CATEGORIES.includes(state.category)) p.set('category', state.category);
  if (state.location) p.set('location', state.location);
  if (positive(state.wavelength) !== null) p.set('wavelength', String(state.wavelength));
  if (percent(state.transmission) !== null) p.set('transmission', String(state.transmission));
  if (state.available) p.set('available', '1');
  if (SORTS.includes(state.sort) && state.sort !== 'name') p.set('sort', state.sort);
  if (Number.isSafeInteger(state.page) && state.page > 1) p.set('page', String(state.page));
  return p.toString();
}

function searchable(item) {
  const fields = Object.entries(item).filter(([key]) => !key.startsWith('quantity_'))
    .map(([, value]) => value);
  fields.push(CATEGORY_LABELS[item.category] || '');
  if (item.category === 'Beam splitter') fields.push('beamsplitter bs 分光镜');
  if (item.transmission_pct !== null) fields.push(`T ${item.transmission_pct}% 透过率`);
  if (item.reflection_pct !== null) fields.push(`R ${item.reflection_pct}% 反射率`);
  if (item.split_ratio) fields.push(`R:T ${item.split_ratio}`);
  if (item.diameter_mm !== null) fields.push(`直径 ${item.diameter_mm} mm`);
  return normalize(fields.join(' '));
}

export function filterItems(items, state) {
  const tokens = normalize(state.q).split(/\s+/u).filter(Boolean);
  const wavelength = positive(state.wavelength);
  const transmission = percent(state.transmission);
  return items.filter(item => {
    if (state.category && item.category !== state.category) return false;
    if (state.location && item.location !== state.location) return false;
    if (state.available && !(Number(item.quantity_available) > 0)) return false;
    if (wavelength !== null) {
      const lower = numeric(item.wavelength_min_nm), upper = numeric(item.wavelength_max_nm);
      // Unknown ranges are not evidence that an optic is suitable.
      if (lower === null || upper === null || wavelength < lower || wavelength > upper) return false;
    }
    if (transmission !== null) {
      const t = numeric(item.transmission_pct);
      if (t === null || t < transmission) return false;
    }
    return !tokens.length || tokens.every(token => searchable(item).includes(token));
  });
}

const compare = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' }).compare;
export function sortItems(items, sort = 'name', lang = 'zh') {
  const compareText = lang === 'en' ? new Intl.Collator('en', { numeric: true, sensitivity: 'base' }).compare : compare;
  return [...items].sort((a, b) => {
    let result = 0;
    if (sort === 'available-desc') result = Number(b.quantity_available || 0) - Number(a.quantity_available || 0);
    if (sort === 'category') result = compareText(a.category, b.category);
    return result || compareText(localizedField(a, 'name', lang), localizedField(b, 'name', lang)) || compareText(a.id, b.id);
  });
}

export function aggregateInventory(items) {
  const categories = Object.fromEntries(CATEGORIES.map(category => [category, 0]));
  return {
    // A CSV row is a stock record: identical models may have different locations.
    models: new Set(items.map(item => [item.category, item.brand || '', item.model || item.name].join('\u0000'))).size,
    records: items.length,
    total: items.reduce((sum, item) => sum + Number(item.quantity_total ?? (
      Number(item.quantity_available || 0) + Number(item.quantity_in_use || 0) +
      Number(item.quantity_loaned || 0) + Number(item.quantity_unavailable || 0)
    )), 0),
    available: items.reduce((sum, item) => sum + Number(item.quantity_available || 0), 0),
    locations: new Set(items.map(item => item.location).filter(Boolean)).size,
    categories: items.reduce((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, categories),
  };
}

export function formatNumber(value, unit = '', lang = 'zh') {
  return numeric(value) === null ? translate(lang, 'unknown') : `${Number(value).toLocaleString(lang === 'en' ? 'en-US' : 'zh-CN', { maximumFractionDigits: 4 })}${unit}`;
}

export function wavelengthLabel(item, lang = 'zh') {
  const min = numeric(item.wavelength_min_nm), max = numeric(item.wavelength_max_nm);
  if (min === null || max === null) return translate(lang, 'unknownWavelength');
  return min === max ? `${formatNumber(min, '', lang)} nm` : `${formatNumber(min, '', lang)}–${formatNumber(max, '', lang)} nm`;
}

export function summarySpecs(item, lang = 'zh') {
  const parts = [];
  if (item.split_ratio) parts.push(`R:T ${item.split_ratio}`);
  if (numeric(item.center_wavelength_nm) !== null) parts.push(`CWL ${formatNumber(item.center_wavelength_nm, '', lang)} nm`);
  if (numeric(item.bandwidth_nm) !== null) parts.push(`FWHM ${formatNumber(item.bandwidth_nm, '', lang)} nm`);
  if (numeric(item.cutoff_wavelength_nm) !== null) parts.push(`${translate(lang, 'cutoffShort')} ${formatNumber(item.cutoff_wavelength_nm, '', lang)} nm`);
  if (numeric(item.optical_density) !== null) parts.push(`OD ${formatNumber(item.optical_density, '', lang)}`);
  if (numeric(item.transmission_pct) !== null) parts.push(`T ${formatNumber(item.transmission_pct, '', lang)}%`);
  if (numeric(item.reflection_pct) !== null) parts.push(`R ${formatNumber(item.reflection_pct, '', lang)}%`);
  if (!parts.length && item.polarization) parts.push(polarizationLabel(item.polarization, lang));
  return [parts.join(' · ') || translate(lang, 'unknownSpecs'), wavelengthLabel(item, lang)];
}

export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  // Neutralize spreadsheet formulas even if prefixed by whitespace/control chars.
  if (/^[\t\r\n]|^\s*[=+\-@]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportCsv(items) {
  const rows = [CSV_FIELDS.join(','), ...items.map(item => CSV_FIELDS.map(field => csvCell(item[field])).join(','))];
  return `\uFEFF${rows.join('\r\n')}\r\n`;
}
