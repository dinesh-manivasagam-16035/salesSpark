/**
 * Sales Spark – app.js
 * ─────────────────────────────────────────────────────────────
 * All seeded data (BUs, services, regions, states) and all UI
 * interaction logic live here. No external dependencies.
 * ─────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════
   1.  DATA  –  Easily extensible constants
   ═══════════════════════════════════════════════════════════ */

/**
 * Fiscal year configuration.
 * FY_START_MONTH: 0-indexed month where FY Q1 begins (3 = April).
 * Quarter boundaries are derived automatically from this value.
 */
const FY_CONFIG = {
  FY_START_MONTH: 3, // April (0 = Jan … 11 = Dec)
  QUARTER_LABELS: ['Q1', 'Q2', 'Q3', 'Q4'],
};

/** Available years in the Year filter drop-down. */
const YEARS = [2022, 2023, 2024];

/**
 * BU → Service mapping.
 * Add a new BU key + array of services to extend.
 */
const BU_SERVICE_MAP = {
  Analytics: [
    'Creator',
    'QENGINE Analytics',
    'Analytics on premise',
    'FLOW',
  ],

  'Helpdesk / People': [
    'HelpDesk',
    'Desk',
    'HR',
    'Recruit',
    'People',
    'Expense',
    'Payroll',
    'Shifts',
    'Peopleplus',
    'Workerly',
    'Workplace',
    'Mail',
    'Docs',
    'Connect',
    'Vault',
    'Wiki',
    'Sign',
    'Cliq',
    'Workdrive',
    'Show',
    'Sheet',
    'Writer',
    'Remotely',
    'Team Inbox',
    'Zeptomail',
    'Learn',
    'Notebook',
    'CommunitySpaces',
  ],

  Projects: [
    'Projects',
    'Sprints',
    'BugTracker',
    'Projects Plus',
    'Qntrl',
  ],

  Marketing: [
    'Campaigns',
    'Marketing Automation',
    'Marketing Plus',
    'Social',
    'Lead Chain',
    'SalesIQ',
    'Forms',
    'Landing Pages',
    'Survey',
    'Sites',
  ],

  Finance: [
    'Books',
    'Inventory',
    'Billing / Subscriptions',
    'Finance Plus',
    'Checkout',
  ],

  Others: [
    'Backstage',
    'Pagesense',
    'Assist',
    'Meeting',
    'Lens',
    'Webinar',
    'Zoho Voice – ANZ',
    'Zoho Voice – APAC',
    'Zoho Voice – IND',
    'Zoho Voice – MEA',
    'Zoho Bookings – ANZ',
    'Zoho Bookings – APAC',
    'Zoho Bookings – IND',
    'Zoho Bookings – MEA',
    'FSM',
    'Zoho Catalyst',
  ],
};

/**
 * Region → State/Territory mapping.
 * To add a region, insert a new key with an array of states.
 */
const REGION_STATE_MAP = {
  'India – North': [
    'Delhi',
    'Haryana',
    'Himachal Pradesh',
    'Jammu & Kashmir',
    'Punjab',
    'Rajasthan',
    'Uttar Pradesh',
    'Uttarakhand',
  ],
  'India – South': [
    'Andhra Pradesh',
    'Karnataka',
    'Kerala',
    'Puducherry',
    'Tamil Nadu',
    'Telangana',
  ],
  'India – East': [
    'Assam',
    'Bihar',
    'Jharkhand',
    'Odisha',
    'Sikkim',
    'West Bengal',
    'North East States',
  ],
  'India – West': [
    'Goa',
    'Gujarat',
    'Madhya Pradesh',
    'Maharashtra',
    'Chhattisgarh',
  ],
  ANZ: [
    'New South Wales',
    'Victoria',
    'Queensland',
    'Western Australia',
    'South Australia',
    'Tasmania',
    'ACT',
    'Northern Territory',
    'New Zealand',
  ],
  APAC: [
    'Singapore',
    'Malaysia',
    'Philippines',
    'Thailand',
    'Indonesia',
    'Vietnam',
    'Hong Kong',
    'Japan',
    'South Korea',
    'Bangladesh',
    'Sri Lanka',
  ],
  MEA: [
    'UAE',
    'Saudi Arabia',
    'Qatar',
    'Bahrain',
    'Kuwait',
    'Oman',
    'Egypt',
    'South Africa',
    'Kenya',
    'Nigeria',
    'Jordan',
    'Lebanon',
  ],
  Americas: [
    'United States',
    'Canada',
    'Brazil',
    'Mexico',
    'Argentina',
    'Colombia',
  ],
  Europe: [
    'United Kingdom',
    'Germany',
    'France',
    'Netherlands',
    'Spain',
    'Italy',
    'Sweden',
    'Denmark',
    'Belgium',
    'Switzerland',
    'Poland',
  ],
};

/* ═══════════════════════════════════════════════════════════
   2.  FISCAL QUARTER UTILITIES
   ═══════════════════════════════════════════════════════════ */

/**
 * Returns the fiscal quarter index (0–3) for a given JS Date.
 * @param {Date} date
 * @returns {{ quarter: number, label: string, fyYear: number }}
 */
function getFiscalQuarterInfo(date) {
  const month = date.getMonth(); // 0-indexed
  const calYear = date.getFullYear();

  // Offset months relative to FY start
  const offset = (month - FY_CONFIG.FY_START_MONTH + 12) % 12;
  const quarter = Math.floor(offset / 3); // 0–3

  // Determine the fiscal year label
  // If we are in the portion of the calendar year that falls before the FY
  // start month, the FY year is the same as the calendar year;
  // otherwise it's the next calendar year.
  const fyYear =
    month >= FY_CONFIG.FY_START_MONTH ? calYear + 1 : calYear;

  return {
    quarter,
    label: FY_CONFIG.QUARTER_LABELS[quarter],
    fyYear,
  };
}

/**
 * Returns a human-readable string like "Q2 FY2025 · Jul – Sep 2024".
 */
function buildQuarterBadgeText(info, date) {
  const qIdx = info.quarter; // 0-based
  const startMonth =
    (FY_CONFIG.FY_START_MONTH + qIdx * 3) % 12;
  const endMonth = (startMonth + 2) % 12;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // Determine the calendar year each boundary month belongs to.
  // Months >= FY_START_MONTH fall in the first calendar year of the FY
  // (i.e. fyYear - 1); months < FY_START_MONTH fall in the second
  // calendar year (i.e. fyYear).
  const fyYear = info.fyYear;
  const startYear =
    startMonth >= FY_CONFIG.FY_START_MONTH ? fyYear - 1 : fyYear;
  const endYear =
    endMonth >= FY_CONFIG.FY_START_MONTH ? fyYear - 1 : fyYear;

  const rangeText =
    startYear === endYear
      ? `${monthNames[startMonth]} – ${monthNames[endMonth]} ${startYear}`
      : `${monthNames[startMonth]} ${startYear} – ${monthNames[endMonth]} ${endYear}`;

  return `${info.label} FY${info.fyYear} &nbsp;·&nbsp; ${rangeText}`;
}

/* ═══════════════════════════════════════════════════════════
   3.  DOM HELPERS
   ═══════════════════════════════════════════════════════════ */

/**
 * Populates a <select> element.
 * @param {HTMLSelectElement} selectEl
 * @param {string[]} options
 * @param {string} [placeholder]  – disabled first option text
 */
function populateSelect(selectEl, options, placeholder) {
  selectEl.innerHTML = '';

  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    opt.disabled = true;
    opt.selected = true;
    selectEl.appendChild(opt);
  }

  options.forEach((label) => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    selectEl.appendChild(opt);
  });
}

/**
 * Populates a multi-select list (<ul> with checkboxes) for Services.
 * @param {HTMLElement} container  – the <ul id="serviceList">
 * @param {string[]} services
 */
function populateServiceList(container, services) {
  container.innerHTML = '';

  if (!services || services.length === 0) {
    const li = document.createElement('li');
    li.className = 'service-placeholder';
    li.textContent = 'Select a BU to view services';
    container.appendChild(li);
    return;
  }

  services.forEach((svc) => {
    const li = document.createElement('li');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = `svc-${svc.replace(/\s+/g, '-').toLowerCase()}`;
    cb.value = svc;
    cb.name = 'service';

    const lbl = document.createElement('label');
    lbl.htmlFor = cb.id;
    lbl.textContent = svc;

    li.appendChild(cb);
    li.appendChild(lbl);
    container.appendChild(li);
  });
}

/* ═══════════════════════════════════════════════════════════
   4.  CURRENT QUARTER BADGE
   ═══════════════════════════════════════════════════════════ */

function renderCurrentQuarterBadge() {
  const today = new Date();
  const info = getFiscalQuarterInfo(today);
  const badgeEl = document.getElementById('currentQuarterBadge');
  const subEl = document.getElementById('currentQuarterSub');

  if (badgeEl) badgeEl.textContent = info.label;
  if (subEl) subEl.innerHTML = buildQuarterBadgeText(info, today);
}

/* ═══════════════════════════════════════════════════════════
   5.  FILTER PANEL INITIALISATION
   ═══════════════════════════════════════════════════════════ */

function initFilters() {
  /* ── Year ── */
  const yearSelect = document.getElementById('yearSelect');
  populateSelect(yearSelect, YEARS.map(String), 'Select Year');

  /* ── Quarter ── */
  const quarterSelect = document.getElementById('quarterSelect');
  populateSelect(
    quarterSelect,
    FY_CONFIG.QUARTER_LABELS,
    'Select Quarter',
  );
  // Pre-select current quarter
  const currentQ = getFiscalQuarterInfo(new Date());
  quarterSelect.value = currentQ.label;

  /* ── Region ── */
  const regionSelect = document.getElementById('regionSelect');
  const regions = Object.keys(REGION_STATE_MAP);
  populateSelect(regionSelect, regions, 'Select Region');

  /* ── State (depends on Region) ── */
  const stateSelect = document.getElementById('stateSelect');
  populateSelect(stateSelect, [], 'Select State');
  stateSelect.disabled = true;

  regionSelect.addEventListener('change', () => {
    const states = REGION_STATE_MAP[regionSelect.value] || [];
    populateSelect(stateSelect, states, 'Select State');
    stateSelect.disabled = states.length === 0;
  });

  /* ── BU ── */
  const buSelect = document.getElementById('buSelect');
  const bus = Object.keys(BU_SERVICE_MAP);
  populateSelect(buSelect, bus, 'Select BU');

  /* ── Service list (multi-select, depends on BU) ── */
  const serviceList = document.getElementById('serviceList');
  populateServiceList(serviceList, []);

  buSelect.addEventListener('change', () => {
    const services = BU_SERVICE_MAP[buSelect.value] || [];
    populateServiceList(serviceList, services);
    // Auto-check all services for the chosen BU
    serviceList
      .querySelectorAll('input[type="checkbox"]')
      .forEach((cb) => {
        cb.checked = true;
      });
    updateSelectedServicesDisplay();
  });

  /* ── Service selection badge counter ── */
  serviceList.addEventListener('change', updateSelectedServicesDisplay);
}

/**
 * Updates a small badge showing how many services are selected.
 */
function updateSelectedServicesDisplay() {
  const checked = document.querySelectorAll(
    '#serviceList input[type="checkbox"]:checked',
  );
  const badge = document.getElementById('serviceCount');
  if (badge) {
    badge.textContent =
      checked.length > 0 ? `${checked.length} selected` : '';
  }
}

/* ═══════════════════════════════════════════════════════════
   6.  FILTER SUMMARY / ACTIVE STATE
   ═══════════════════════════════════════════════════════════ */

/**
 * Returns the currently selected filter values as a plain object.
 * Useful for future API calls or report generation.
 */
function getActiveFilters() {
  const selectedServices = Array.from(
    document.querySelectorAll('#serviceList input[type="checkbox"]:checked'),
  ).map((cb) => cb.value);

  return {
    year: document.getElementById('yearSelect').value || null,
    quarter: document.getElementById('quarterSelect').value || null,
    region: document.getElementById('regionSelect').value || null,
    state: document.getElementById('stateSelect').value || null,
    bu: document.getElementById('buSelect').value || null,
    services: selectedServices,
  };
}

/* ═══════════════════════════════════════════════════════════
   7.  CONTENT PLACEHOLDER HELPERS
   ═══════════════════════════════════════════════════════════ */

/**
 * Renders the default "no data yet" placeholder in the content area.
 * Shared by the initial page load (via index.html) and Reset action.
 */
function renderDefaultPlaceholder() {
  const placeholder = document.getElementById('contentPlaceholder');
  if (!placeholder) return;
  placeholder.innerHTML = `
    <div class="content-empty-icon" aria-hidden="true">📊</div>
    <p class="placeholder-hint">
      Select filters above and click <strong>Apply</strong> to load data.
    </p>
    <p class="placeholder-hint secondary">
      Content panels will be rendered here in the next stage.
    </p>`;
}

/* ═══════════════════════════════════════════════════════════
   8.  "APPLY FILTERS" ACTION  (placeholder for Stage 2)
   ═══════════════════════════════════════════════════════════ */

function handleApplyFilters() {
  const filters = getActiveFilters();
  console.log('[Sales Spark] Active filters:', filters);

  // Stage 2: pass `filters` to a data-fetching / rendering layer.
  const placeholder = document.getElementById('contentPlaceholder');
  if (placeholder) {
    const q = filters.quarter || '—';
    const yr = filters.year || '—';
    const region = filters.region || 'All Regions';
    const bu = filters.bu || 'All BUs';
    placeholder.innerHTML = `
      <p class="placeholder-hint">
        Showing data for <strong>${q} ${yr}</strong> · 
        Region: <strong>${region}</strong> · 
        BU: <strong>${bu}</strong>
      </p>
      <p class="placeholder-hint secondary">
        Content panels will be rendered here in the next stage.
      </p>`;
  }
}

/* ═══════════════════════════════════════════════════════════
   9.  RESET FILTERS
   ═══════════════════════════════════════════════════════════ */

function handleResetFilters() {
  document.getElementById('yearSelect').selectedIndex = 0;

  const quarterSelect = document.getElementById('quarterSelect');
  const currentQ = getFiscalQuarterInfo(new Date());
  quarterSelect.value = currentQ.label;

  document.getElementById('regionSelect').selectedIndex = 0;

  const stateSelect = document.getElementById('stateSelect');
  populateSelect(stateSelect, [], 'Select State');
  stateSelect.disabled = true;

  document.getElementById('buSelect').selectedIndex = 0;

  const serviceList = document.getElementById('serviceList');
  populateServiceList(serviceList, []);
  updateSelectedServicesDisplay();

  renderDefaultPlaceholder();
}

/* ═══════════════════════════════════════════════════════════
   9.  COLLAPSIBLE FILTER PANEL  (mobile UX)
   ═══════════════════════════════════════════════════════════ */

function initFilterToggle() {
  const toggleBtn = document.getElementById('filterToggleBtn');
  const filterBody = document.getElementById('filterBody');
  if (!toggleBtn || !filterBody) return;

  toggleBtn.addEventListener('click', () => {
    // classList.toggle returns true when the class was ADDED (panel is now collapsed).
    const isCollapsed = filterBody.classList.toggle('collapsed');
    toggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
    toggleBtn.querySelector('.toggle-icon').textContent = isCollapsed
      ? '▸'  // collapsed → show right-arrow (click to expand)
      : '▾'; // expanded  → show down-arrow  (click to collapse)
  });
}

/* ═══════════════════════════════════════════════════════════
   10. ENTRY POINT
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  renderCurrentQuarterBadge();
  renderDefaultPlaceholder();
  initFilters();
  initFilterToggle();

  document
    .getElementById('applyFiltersBtn')
    ?.addEventListener('click', handleApplyFilters);

  document
    .getElementById('resetFiltersBtn')
    ?.addEventListener('click', handleResetFilters);
});
