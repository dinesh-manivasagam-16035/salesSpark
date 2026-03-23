/* =====================================================================
   SalesSpark – Main Application
   Handles all UI rendering, filtering, charts, target config, and
   interactive features. Uses native Canvas API for charts.
   ===================================================================== */

const App = (() => {
  /* ---------- State ---------- */
  let state = {
    activeTab: "dashboard",
    year: 2024,
    quarter: null,
    region: "All",
    bu: "All",
    configMode: "individual",
    configPerson: null,
    configQuarter: "Q1",
    configTargetType: "Sales",
    configBU: Object.keys(DATA.buServiceMap)[0],
    configCountry: "",
    configState: "",
    selectedServices: [],
    targetAmounts: {}
  };

  function init() {
    const fq = DATA.getCurrentFiscalQuarter();
    state.quarter = fq.quarter;
    state.year = Math.min(Math.max(fq.year, 2022), 2024);
    state.configPerson = DATA.orgHierarchy.children[0];

    renderHeader();
    renderNavTabs();
    renderDashboard();
    renderTargetConfig();
    renderLeaderboardTab();
    bindGlobalEvents();
    switchTab("dashboard");
  }

  /* ================================================================
     HEADER
     ================================================================ */
  function renderHeader() {
    const fq = DATA.getCurrentFiscalQuarter();
    document.getElementById("header").innerHTML = `
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        SalesSpark
      </div>
      <div class="header-actions">
        <span class="quarter-badge">FY${String(fq.fiscalYear).slice(-2)} ${fq.quarter} — Current</span>
        <button class="icon-btn" id="btnNotifications" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        </button>
        <button class="icon-btn" id="btnSettings" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <div class="avatar" style="cursor:pointer" id="btnProfile" title="Profile">AD</div>
      </div>`;
  }

  /* ================================================================
     NAV TABS
     ================================================================ */
  function renderNavTabs() {
    const tabs = [
      { id: "dashboard", label: "Dashboard" },
      { id: "targets", label: "Target Configuration" },
      { id: "leaderboard", label: "Leaderboard" }
    ];
    document.getElementById("nav").innerHTML = tabs.map(t =>
      `<div class="nav-tab${t.id === state.activeTab ? ' active' : ''}" data-tab="${t.id}">${t.label}</div>`
    ).join("");
  }

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll(".nav-tab").forEach(el => el.classList.toggle("active", el.dataset.tab === tabId));
    document.querySelectorAll(".tab-content").forEach(el => el.classList.toggle("active", el.id === "tab-" + tabId));
    if (tabId === "dashboard") renderDashboardContent();
    if (tabId === "leaderboard") renderLeaderboardContent();
  }

  /* ================================================================
     DASHBOARD
     ================================================================ */
  function renderDashboard() {
    document.getElementById("tab-dashboard").innerHTML = `
      <div class="filter-bar" id="dashboardFilters"></div>
      <div id="dashMetrics"></div>
      <div id="dashPrediction"></div>
      <div id="dashRunRate"></div>
      <div id="dashQuarterBreakdown"></div>
      <div class="charts-grid" id="dashCharts"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" id="dashBottomRow">
        <div id="dashRetention"></div>
        <div id="dashFeed"></div>
      </div>
      <div id="dashOrgTree" class="section"></div>`;
  }

  function renderDashboardContent() {
    renderDashboardFilters();
    const d = DATA.financialData[state.year] && DATA.financialData[state.year][state.quarter]
      ? DATA.financialData[state.year][state.quarter]
      : DATA.financialData[2024]["Q1"];
    renderMetrics(d);
    renderPrediction(d);
    renderRunRate(d);
    renderQuarterBreakdown();
    renderCharts(d);
    renderRetention(d);
    renderFeed();
    renderOrgTreeDashboard();
  }

  function renderDashboardFilters() {
    const regionOptions = ["All", ...DATA.regions].map(r => `<option value="${r}"${r === state.region ? ' selected' : ''}>${r}</option>`).join("");
    const buOptions = ["All", ...DATA.buList].map(b => `<option value="${b}"${b === state.bu ? ' selected' : ''}>${b}</option>`).join("");
    const yearOptions = DATA.years.map(y => `<option value="${y}"${y === state.year ? ' selected' : ''}>${y}</option>`).join("");
    const qOptions = DATA.quarters.map(q => `<option value="${q}"${q === state.quarter ? ' selected' : ''}>${q}</option>`).join("");

    document.getElementById("dashboardFilters").innerHTML = `
      <div class="filter-group"><label>Year</label><select id="filterYear">${yearOptions}</select></div>
      <div class="filter-group"><label>Quarter</label><select id="filterQuarter">${qOptions}</select></div>
      <div class="filter-group"><label>Region</label><select id="filterRegion">${regionOptions}</select></div>
      <div class="filter-group"><label>BU Group</label><select id="filterBU">${buOptions}</select></div>
      <div class="filter-group"><label>Service</label><select id="filterService"><option value="All">All Services</option></select></div>`;

    updateServiceFilter();

    document.getElementById("filterYear").onchange = e => { state.year = +e.target.value; renderDashboardContent(); };
    document.getElementById("filterQuarter").onchange = e => { state.quarter = e.target.value; renderDashboardContent(); };
    document.getElementById("filterRegion").onchange = e => { state.region = e.target.value; renderDashboardContent(); };
    document.getElementById("filterBU").onchange = e => { state.bu = e.target.value; updateServiceFilter(); renderDashboardContent(); };
  }

  function updateServiceFilter() {
    const services = DATA.servicesForBU(state.bu);
    const sel = document.getElementById("filterService");
    if (!sel) return;
    sel.innerHTML = `<option value="All">All Services (${services.length})</option>` +
      services.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  /* ---------- Metrics ---------- */
  function renderMetrics(d) {
    const pctAchieved = DATA.pct(d.achievedRevenue, d.targetRevenue);
    const gap = d.targetRevenue - d.achievedRevenue;
    const gapPct = DATA.pct(gap, d.targetRevenue);
    document.getElementById("dashMetrics").innerHTML = `
      <div class="metrics-row">
        <div class="metric-card info">
          <div class="label">Target Revenue</div>
          <div class="value">${DATA.formatCurrency(d.targetRevenue)}</div>
          <div class="sub">${state.year} ${state.quarter}</div>
        </div>
        <div class="metric-card ${pctAchieved >= 80 ? 'success' : pctAchieved >= 60 ? 'warning' : 'danger'}">
          <div class="label">Achieved Revenue</div>
          <div class="value">${DATA.formatCurrency(d.achievedRevenue)}</div>
          <div class="sub"><span class="${pctAchieved >= 70 ? 'up' : 'down'}">${pctAchieved}% of target</span></div>
          <div class="progress-bar"><div class="fill ${pctAchieved >= 80 ? 'green' : pctAchieved >= 60 ? 'yellow' : 'red'}" style="width:${Math.min(pctAchieved, 100)}%"></div></div>
        </div>
        <div class="metric-card info">
          <div class="label">Total Pipeline</div>
          <div class="value">${DATA.formatCurrency(d.pipeline)}</div>
          <div class="sub">${DATA.pct(d.pipeline, d.targetRevenue)}% coverage</div>
        </div>
        <div class="metric-card ${d.winRate >= 35 ? 'success' : 'warning'}">
          <div class="label">Win Rate</div>
          <div class="value">${d.winRate}%</div>
          <div class="sub"><span class="${d.winRate >= 35 ? 'up' : 'down'}">${d.winRate >= 35 ? '↑' : '↓'} vs benchmark (35%)</span></div>
        </div>
        <div class="metric-card ${d.atRiskDeals <= 3 ? 'success' : 'danger'}">
          <div class="label">At-Risk Deals</div>
          <div class="value">${d.atRiskDeals}</div>
          <div class="sub"><span class="down">Needs attention</span></div>
        </div>
        <div class="metric-card ${gapPct <= 20 ? 'success' : 'warning'}">
          <div class="label">Gap to Target</div>
          <div class="value">${DATA.formatCurrency(gap)}</div>
          <div class="sub">You are <strong>${gapPct}%</strong> away from achieving ${DATA.formatCurrency(d.targetRevenue)}</div>
        </div>
      </div>`;
  }

  /* ---------- Prediction ---------- */
  function renderPrediction(d) {
    const pctDone = DATA.pct(d.achievedRevenue, d.targetRevenue);
    const daysLeft = DATA.getBusinessDaysRemaining();
    const gap = d.targetRevenue - d.achievedRevenue;
    const dailyRunRate = daysLeft > 0 ? gap / daysLeft : 0;
    const projectedEnd = d.achievedRevenue + dailyRunRate * daysLeft;
    const willHit = projectedEnd >= d.targetRevenue;
    const confidence = Math.min(100, Math.round(pctDone + (daysLeft > 0 ? (dailyRunRate > 0 ? 15 : 0) : 0)));

    document.getElementById("dashPrediction").innerHTML = `
      <div class="prediction-card">
        <div class="pred-item">
          <div class="pred-label">Predicted End-of-Quarter</div>
          <div class="pred-value" style="color:${willHit ? 'var(--success)' : 'var(--danger)'}">${willHit ? '✓ On Track' : '⚠ At Risk'}</div>
          <div class="pred-detail">Projected: ${DATA.formatCurrency(projectedEnd)} (${DATA.pct(projectedEnd, d.targetRevenue)}% of target)</div>
        </div>
        <div class="pred-item">
          <div class="pred-label">Confidence Score</div>
          <div class="pred-value">${confidence}%</div>
          <div class="pred-detail">Based on current run rate &amp; pipeline strength</div>
        </div>
        <div class="pred-item">
          <div class="pred-label">Business Days Remaining</div>
          <div class="pred-value">${daysLeft}</div>
          <div class="pred-detail">Excluding weekends</div>
        </div>
        <div class="pred-item">
          <div class="pred-label">Required Daily Run Rate</div>
          <div class="pred-value">${DATA.formatCurrency(dailyRunRate)}</div>
          <div class="pred-detail">To close the ${DATA.formatCurrency(gap)} gap</div>
        </div>
      </div>`;
  }

  /* ---------- Run Rate ---------- */
  function renderRunRate(d) {
    const gap = d.targetRevenue - d.achievedRevenue;
    const daysLeft = DATA.getBusinessDaysRemaining();
    const dailyRate = daysLeft > 0 ? gap / daysLeft : 0;
    const weeklyRate = dailyRate * 5;
    const weeksLeft = Math.ceil(daysLeft / 5);
    document.getElementById("dashRunRate").innerHTML = `
      <div class="run-rate-card">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Run Rate Plan to Hit Target
        </h4>
        <p style="font-size:.88rem;color:var(--text-secondary);margin-bottom:8px">
          You are <strong>${DATA.pct(gap, d.targetRevenue)}%</strong> away from achieving <strong>${DATA.formatCurrency(d.targetRevenue)}</strong>.
          Follow this run rate (excluding weekends) to close the gap.
        </p>
        <div class="stat-row">
          <div class="stat"><div class="val">${DATA.formatCurrency(dailyRate)}</div><div class="lbl">Daily</div></div>
          <div class="stat"><div class="val">${DATA.formatCurrency(weeklyRate)}</div><div class="lbl">Weekly</div></div>
          <div class="stat"><div class="val">${daysLeft}</div><div class="lbl">Biz Days Left</div></div>
          <div class="stat"><div class="val">${weeksLeft}</div><div class="lbl">Weeks Left</div></div>
          <div class="stat"><div class="val">${DATA.formatCurrency(gap)}</div><div class="lbl">Gap</div></div>
        </div>
      </div>`;
  }

  /* ---------- Quarter Breakdown ---------- */
  function renderQuarterBreakdown() {
    const yearData = DATA.financialData[state.year];
    if (!yearData) return;
    const fq = DATA.getCurrentFiscalQuarter();
    let rows = DATA.quarters.map(q => {
      const d = yearData[q];
      const isCurrent = q === fq.quarter && state.year === fq.year;
      return `<tr class="${isCurrent ? 'current-q' : ''}">
        <td>${q} ${isCurrent ? '<span class="quarter-badge" style="font-size:.7rem;padding:2px 8px">Current</span>' : ''}</td>
        <td>${DATA.formatCurrency(d.targetRevenue)}</td>
        <td>${DATA.formatCurrency(d.achievedRevenue)}</td>
        <td>${DATA.pct(d.achievedRevenue, d.targetRevenue)}%</td>
        <td>${DATA.formatCurrency(d.pipeline)}</td>
        <td>${d.winRate}%</td>
        <td>${d.atRiskDeals}</td>
      </tr>`;
    }).join("");

    document.getElementById("dashQuarterBreakdown").innerHTML = `
      <div class="section">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${state.year} Quarterly Breakdown
        </div>
        <div style="overflow-x:auto">
          <table class="q-breakdown">
            <thead><tr><th>Quarter</th><th>Target</th><th>Achieved</th><th>%</th><th>Pipeline</th><th>Win Rate</th><th>At-Risk</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  /* ---------- Charts (Canvas) ---------- */
  function renderCharts(d) {
    document.getElementById("dashCharts").innerHTML = `
      <div class="chart-card"><h3>Revenue by Region</h3><canvas id="chartRegion"></canvas></div>
      <div class="chart-card"><h3>Revenue Trend (${state.year})</h3><canvas id="chartTrend"></canvas></div>
      <div class="chart-card"><h3>Win Rate by Region</h3><canvas id="chartWinRate"></canvas></div>
      <div class="chart-card"><h3>BU Performance</h3><canvas id="chartBU"></canvas></div>`;

    requestAnimationFrame(() => {
      drawBarChart("chartRegion", Object.keys(DATA.regionRevenue), Object.values(DATA.regionRevenue).map(r => r.achieved), Object.values(DATA.regionRevenue).map(r => r.target));
      drawLineChart("chartTrend", DATA.quarters, DATA.quarters.map(q => DATA.financialData[state.year][q].achievedRevenue), DATA.quarters.map(q => DATA.financialData[state.year][q].targetRevenue));
      drawHBarChart("chartWinRate", Object.keys(DATA.regionRevenue).slice(0, 8), Object.keys(DATA.regionRevenue).slice(0, 8).map((_, i) => 25 + (i * 7 + 3) % 30));
      const buKeys = Object.keys(DATA.buPerformance).slice(0, 8);
      drawBarChart("chartBU", buKeys.map(k => k.length > 12 ? k.slice(0, 12) + "…" : k), buKeys.map(k => DATA.buPerformance[k].revenue), null);
    });
  }

  function drawBarChart(canvasId, labels, values, values2) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width - 40;
    const H = 220;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const maxVal = Math.max(...values, ...(values2 || [0])) * 1.15;
    const barW = values2 ? (W - 60) / labels.length / 2.5 : (W - 60) / labels.length / 1.5;
    const chartH = H - 50;
    const startX = 50;

    ctx.fillStyle = "#e2e5ec";
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartH / 4) * i;
      ctx.fillRect(startX, y, W - 60, 1);
      ctx.fillStyle = "#5f6b7a"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(DATA.formatCurrency(maxVal - (maxVal / 4) * i), startX - 6, y + 4);
      ctx.fillStyle = "#e2e5ec";
    }

    labels.forEach((label, i) => {
      const x = startX + i * ((W - 60) / labels.length) + ((W - 60) / labels.length - barW * (values2 ? 2.2 : 1)) / 2;
      const h = (values[i] / maxVal) * chartH;

      ctx.fillStyle = "#2d8a7b";
      ctx.beginPath();
      roundRect(ctx, x, 10 + chartH - h, barW, h, 3);
      ctx.fill();

      if (values2) {
        const h2 = (values2[i] / maxVal) * chartH;
        ctx.fillStyle = "#e2e5ec";
        ctx.beginPath();
        roundRect(ctx, x + barW * 1.2, 10 + chartH - h2, barW, h2, 3);
        ctx.fill();
      }

      ctx.fillStyle = "#5f6b7a"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(label.length > 8 ? label.slice(0, 7) + "…" : label, x + barW * (values2 ? 1.1 : 0.5), H - 6);
    });
  }

  function drawLineChart(canvasId, labels, values, values2) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width - 40;
    const H = 220;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const allVals = [...values, ...(values2 || [])];
    const maxVal = Math.max(...allVals) * 1.15;
    const chartH = H - 50;
    const startX = 50;
    const stepX = (W - 70) / (labels.length - 1);

    ctx.fillStyle = "#e2e5ec";
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartH / 4) * i;
      ctx.fillRect(startX, y, W - 60, 1);
      ctx.fillStyle = "#5f6b7a"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(DATA.formatCurrency(maxVal - (maxVal / 4) * i), startX - 6, y + 4);
      ctx.fillStyle = "#e2e5ec";
    }

    function drawLine(vals, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
      vals.forEach((v, i) => {
        const x = startX + i * stepX;
        const y = 10 + chartH - (v / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      vals.forEach((v, i) => {
        const x = startX + i * stepX;
        const y = 10 + chartH - (v / maxVal) * chartH;
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      });
    }

    drawLine(values, "#2d8a7b");
    if (values2) drawLine(values2, "#e2e5ec");

    labels.forEach((label, i) => {
      ctx.fillStyle = "#5f6b7a"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(label, startX + i * stepX, H - 6);
    });
  }

  function drawHBarChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width - 40;
    const H = 220;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const maxVal = Math.max(...values) * 1.2;
    const barH = Math.min(20, (H - 20) / labels.length - 6);
    const startX = 80;

    labels.forEach((label, i) => {
      const y = 10 + i * ((H - 20) / labels.length);
      const w = (values[i] / maxVal) * (W - startX - 40);

      ctx.fillStyle = "#5f6b7a"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(label.length > 9 ? label.slice(0, 8) + "…" : label, startX - 8, y + barH / 2 + 4);

      ctx.fillStyle = values[i] >= 35 ? "#2d8a7b" : "#e6a817";
      ctx.beginPath();
      roundRect(ctx, startX, y, w, barH, 3);
      ctx.fill();

      ctx.fillStyle = "#1e2a3a"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(values[i] + "%", startX + w + 6, y + barH / 2 + 4);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- Retention / Churn ---------- */
  function renderRetention(d) {
    document.getElementById("dashRetention").innerHTML = `
      <div class="chart-card">
        <h3>Customer Retention & Churn</h3>
        <div class="metrics-row" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
          <div class="metric-card success" style="padding:12px 14px">
            <div class="label">Renewal Rate</div>
            <div class="value" style="font-size:1.3rem">${d.renewalRate}%</div>
            <div class="progress-bar"><div class="fill green" style="width:${d.renewalRate}%"></div></div>
          </div>
          <div class="metric-card danger" style="padding:12px 14px">
            <div class="label">Churn Rate</div>
            <div class="value" style="font-size:1.3rem">${d.churnRate}%</div>
            <div class="progress-bar"><div class="fill red" style="width:${d.churnRate * 10}%"></div></div>
          </div>
        </div>
        <div style="font-size:.85rem;color:var(--text-secondary)">
          <p>📊 <strong>Net Retention:</strong> ${(d.renewalRate - d.churnRate).toFixed(1)}% — ${d.renewalRate - d.churnRate > 90 ? 'Healthy' : 'Needs attention'}</p>
          <p style="margin-top:6px">⚠ ${d.atRiskDeals} accounts flagged for renewal risk in the next 30 days</p>
        </div>
      </div>`;
  }

  /* ---------- Live Feed ---------- */
  function renderFeed() {
    const items = DATA.liveFeed.map(f => `
      <div class="feed-item">
        <div class="feed-dot ${f.type}"></div>
        <div class="feed-text">${f.text}</div>
        <div class="feed-time">${f.time}</div>
      </div>`).join("");
    document.getElementById("dashFeed").innerHTML = `
      <div class="chart-card">
        <h3>Live Activity Feed</h3>
        <div class="feed-list">${items}</div>
      </div>`;
  }

  /* ---------- Org Tree (Dashboard) ---------- */
  function renderOrgTreeDashboard() {
    document.getElementById("dashOrgTree").innerHTML = `
      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Organization Targets
      </div>
      <div class="org-tree">${renderTreeNode(DATA.orgHierarchy, 0)}</div>`;
  }

  function renderTreeNode(node, depth) {
    const pct = DATA.pct(node.achieved, node.target);
    const status = pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger';
    const borderClass = status + '-border';
    const childrenHTML = (node.children || []).length > 0
      ? `<div class="tree-children">${node.children.map(c => renderTreeNode(c, depth + 1)).join("")}</div>`
      : "";
    return `
      <div class="tree-node ${borderClass}">
        <div class="tree-node-header">
          <div class="avatar">${node.avatar}</div>
          <div class="tree-node-info">
            <div class="name">${node.name}</div>
            <div class="role">${node.role}</div>
          </div>
          <div class="pct-badge ${status === 'success' ? 'high' : status === 'warning' ? 'mid' : 'low'}">${pct}%</div>
        </div>
        <div class="tree-node-metrics">
          <div class="metric"><div class="val">${DATA.formatCurrency(node.target)}</div><div class="lbl">Target</div></div>
          <div class="metric"><div class="val">${DATA.formatCurrency(node.achieved)}</div><div class="lbl">Achieved</div></div>
          <div class="metric"><div class="val">${DATA.formatCurrency(node.target - node.achieved)}</div><div class="lbl">Gap</div></div>
        </div>
        <div class="progress-bar" style="margin-top:8px"><div class="fill ${pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red'}" style="width:${Math.min(pct, 100)}%"></div></div>
      </div>
      ${childrenHTML}`;
  }

  /* ================================================================
     TARGET CONFIGURATION
     ================================================================ */
  function renderTargetConfig() {
    const el = document.getElementById("tab-targets");
    el.innerHTML = `
      <div class="section-title" style="font-size:1.25rem;margin-bottom:18px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        Target Configuration
      </div>
      <div id="configPersonCard"></div>
      <div id="configToggle"></div>
      <div id="configDetails"></div>
      <div id="configReporting"></div>
      <div id="configSelfTarget"></div>
      <div id="configCommission"></div>
      <div id="configOrgTree" class="section" style="margin-top:24px"></div>`;
    renderConfigPerson();
    renderConfigToggle();
    renderConfigDetails();
    renderConfigReporting();
    renderConfigSelfTarget();
    renderConfigCommission();
    renderConfigOrgTreeSection();
  }

  function renderConfigPerson() {
    const p = state.configPerson;
    document.getElementById("configPersonCard").innerHTML = `
      <div class="config-section" style="padding:16px 20px">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="avatar" style="width:46px;height:46px;font-size:1rem">${p.avatar}</div>
          <div>
            <div style="font-weight:700;font-size:1.05rem">${p.name}</div>
            <div style="color:var(--text-secondary);font-size:.88rem">${p.role}</div>
            <div style="color:var(--text-secondary);font-size:.82rem">Reports to: <strong>${p.reportsTo || 'N/A'}</strong></div>
          </div>
        </div>
      </div>`;
  }

  function renderConfigToggle() {
    document.getElementById("configToggle").innerHTML = `
      <div class="toggle-group">
        <button class="toggle-btn ${state.configMode === 'individual' ? 'active' : ''}" data-mode="individual">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Individual
        </button>
        <button class="toggle-btn ${state.configMode === 'team' ? 'active' : ''}" data-mode="team">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          Team Rollup
        </button>
      </div>`;
  }

  function renderConfigDetails() {
    const quarters = DATA.quarters.map(q => `<div class="pill ${q === state.configQuarter ? 'active' : ''}" data-quarter="${q}">${q}</div>`).join("");
    const types = ["Sales", "Partner", "Renewal"].map(t => `<div class="pill ${t === state.configTargetType ? 'active' : ''}" data-type="${t}">${t}</div>`).join("");
    const buOptions = DATA.buList.map(b => `<option value="${b}"${b === state.configBU ? ' selected' : ''}>${b}</option>`).join("");
    const services = DATA.servicesForBU(state.configBU);
    const chips = services.map(s => `<div class="service-chip ${state.selectedServices.includes(s) ? 'selected' : ''}" data-service="${s}">${s}</div>`).join("");

    const countries = DATA.countriesForRegion("All");
    const countryOptions = countries.map(c => `<option value="${c}"${c === state.configCountry ? ' selected' : ''}>${c}</option>`).join("");
    const detectedRegion = state.configCountry ? DATA.regionForCountry(state.configCountry) : "";

    document.getElementById("configDetails").innerHTML = `
      <div class="config-section">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          TARGET DETAILS
        </h3>
        <div style="margin-bottom:14px"><div style="font-weight:600;margin-bottom:6px;color:var(--text-secondary);font-size:.82rem">Quarter</div><div class="pill-group" id="quarterPills">${quarters}</div></div>
        <div style="margin-bottom:14px"><div style="font-weight:600;margin-bottom:6px;color:var(--text-secondary);font-size:.82rem">Target Type</div><div class="pill-group" id="typePills">${types}</div></div>
        <div class="filter-group" style="margin-bottom:14px">
          <label>BU Group</label>
          <select id="configBUSelect">${buOptions}</select>
        </div>
        <div style="margin-bottom:14px">
          <div style="font-weight:600;margin-bottom:6px;color:var(--text-secondary);font-size:.82rem">
            Services <span style="color:var(--accent);font-weight:700">(${state.selectedServices.length} selected)</span>
          </div>
          <div class="service-chips" id="serviceChips">${chips}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:12px">
          <div class="filter-group" style="flex:1">
            <label>🌐 Country / State</label>
            <select id="configCountrySelect"><option value="">Select Country</option>${countryOptions}</select>
          </div>
        </div>
        ${detectedRegion ? `<div style="font-size:.88rem">Region: <span class="region-badge">${detectedRegion}</span></div>` : ''}
      </div>`;
  }

  function renderConfigReporting() {
    const managers = DATA.flattenOrg(DATA.orgHierarchy).filter(n => n.children && n.children.length > 0);
    const options = managers.map(m => `<option value="${m.id}" ${state.configPerson.reportsTo === m.name ? 'selected' : ''}>${m.name} (${m.role})</option>`).join("");
    document.getElementById("configReporting").innerHTML = `
      <div class="config-section">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          REPORTING MANAGER
        </h3>
        <select id="configManagerSelect" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:.95rem">
          ${options}
        </select>
      </div>`;
  }

  function renderConfigSelfTarget() {
    const key = `${state.configPerson.id}_${state.configQuarter}_${state.configTargetType}`;
    const savedAmount = state.targetAmounts[key] || state.configPerson.target;
    const formatted = savedAmount.toLocaleString();
    document.getElementById("configSelfTarget").innerHTML = `
      <div class="config-section">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Self Target
        </h3>
        <p style="color:var(--text-secondary);font-size:.85rem;margin-bottom:10px">Direct contribution — not from team rollup.</p>
        <div class="target-input-row">
          <span class="currency-label">$</span>
          <input type="text" id="targetAmountInput" value="${formatted}" />
          <button class="save-btn" id="saveTargetBtn" title="Save target">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          </button>
        </div>
        ${state.configMode === 'team' ? renderTeamRollup() : ''}
      </div>`;
  }

  function renderTeamRollup() {
    const children = state.configPerson.children || [];
    if (children.length === 0) return '<p style="color:var(--text-secondary);font-size:.85rem;margin-top:12px">No direct reports.</p>';
    const totalTarget = children.reduce((s, c) => s + c.target, 0);
    const totalAchieved = children.reduce((s, c) => s + c.achieved, 0);
    let rows = children.map(c => {
      const p = DATA.pct(c.achieved, c.target);
      return `<tr>
        <td><div class="rep-info"><div class="avatar" style="width:28px;height:28px;font-size:.7rem">${c.avatar}</div><div><div class="rep-name" style="font-size:.85rem">${c.name}</div></div></div></td>
        <td>${DATA.formatCurrency(c.target)}</td>
        <td>${DATA.formatCurrency(c.achieved)}</td>
        <td><span class="pct-badge ${p >= 80 ? 'high' : p >= 60 ? 'mid' : 'low'}">${p}%</span></td>
      </tr>`;
    }).join("");

    return `
      <div style="margin-top:16px">
        <h4 style="font-size:.88rem;font-weight:700;margin-bottom:10px">Team Rollup — ${DATA.formatCurrency(totalTarget)} Target / ${DATA.formatCurrency(totalAchieved)} Achieved</h4>
        <table class="q-breakdown" style="margin-top:0">
          <thead><tr><th>Rep</th><th>Target</th><th>Achieved</th><th>%</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderConfigCommission() {
    const pct = DATA.pct(state.configPerson.achieved, state.configPerson.target);
    const tiers = DATA.commissionTiers.map(t => {
      const isCurrent = pct >= t.min && pct < t.max;
      return `<div class="tier-box ${isCurrent ? 'current' : ''}">
        <div class="tier-label">${t.label}</div>
        <div class="tier-rate">${t.rate}%</div>
        <div class="tier-range">${t.min}% – ${t.max === Infinity ? '∞' : t.max + '%'}</div>
      </div>`;
    }).join("");

    const currentTier = DATA.commissionTiers.find(t => pct >= t.min && pct < t.max);
    const nextTier = DATA.commissionTiers.find(t => t.min > pct);
    const nextInfo = nextTier ? `Reach ${nextTier.min}% (${DATA.formatCurrency(state.configPerson.target * nextTier.min / 100)}) to unlock <strong>${nextTier.rate}% ${nextTier.label}</strong> commission.` : "You are at the highest tier!";

    document.getElementById("configCommission").innerHTML = `
      <div class="commission-card">
        <h3 style="font-size:.92rem;font-weight:700;display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--accent)"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Commission Accelerator
        </h3>
        <p style="font-size:.85rem;color:var(--text-secondary);margin-bottom:10px">
          Current attainment: <strong>${pct}%</strong> → Commission rate: <strong>${currentTier ? currentTier.rate : 8}%</strong>
        </p>
        <div class="commission-tiers">${tiers}</div>
        <p style="font-size:.85rem;color:var(--accent-dark);margin-top:12px;font-weight:500">${nextInfo}</p>
      </div>`;
  }

  function renderConfigOrgTreeSection() {
    document.getElementById("configOrgTree").innerHTML = `
      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        Organization Hierarchy
      </div>
      <div class="org-tree">${renderTreeNode(DATA.orgHierarchy, 0)}</div>`;
  }

  /* ================================================================
     LEADERBOARD TAB
     ================================================================ */
  function renderLeaderboardTab() {
    document.getElementById("tab-leaderboard").innerHTML = `
      <div class="section-title" style="font-size:1.15rem;margin-bottom:16px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 6 9 6 9zm12 0h1.5a2.5 2.5 0 000-5C17 4 18 9 18 9zm-6-5l1 6h-2l1-6zm-6 8h12v2a6 6 0 01-12 0v-2z"/></svg>
        Leadership Board
      </div>
      <div id="leaderboardContent"></div>`;
  }

  function renderLeaderboardContent() {
    const allPeople = DATA.flattenOrg(DATA.orgHierarchy).filter(n => n.id !== DATA.orgHierarchy.id);
    const sorted = allPeople.sort((a, b) => DATA.pct(b.achieved, b.target) - DATA.pct(a.achieved, a.target));

    let rows = sorted.map((p, i) => {
      const pctVal = DATA.pct(p.achieved, p.target);
      const gap = p.target - p.achieved;
      const daysLeft = DATA.getBusinessDaysRemaining();
      const runRate = daysLeft > 0 ? gap / daysLeft : 0;
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const statusClass = pctVal < 60 ? 'at-risk' : '';
      return `
        <div class="leaderboard-row ${statusClass}">
          <div class="rank ${rankClass}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1)}</div>
          <div class="rep-info">
            <div class="avatar">${p.avatar}</div>
            <div>
              <div class="rep-name">${p.name}</div>
              <div class="rep-role">${p.role}</div>
            </div>
          </div>
          <div style="text-align:right">${DATA.formatCurrency(p.achieved)}<br><span style="font-size:.75rem;color:var(--text-secondary)">of ${DATA.formatCurrency(p.target)}</span></div>
          <div style="text-align:center"><span class="pct-badge ${pctVal >= 80 ? 'high' : pctVal >= 60 ? 'mid' : 'low'}">${pctVal}%</span></div>
          <div style="text-align:right;font-size:.85rem">${DATA.formatCurrency(gap)}</div>
          <div style="text-align:right;font-size:.85rem">${DATA.formatCurrency(runRate)}/d</div>
        </div>`;
    }).join("");

    document.getElementById("leaderboardContent").innerHTML = `
      <div class="leaderboard">
        <div class="leaderboard-header">
          <div>Rank</div><div>Rep</div><div style="text-align:right">Revenue</div><div style="text-align:center">Attainment</div><div style="text-align:right">Gap</div><div style="text-align:right">Run Rate</div>
        </div>
        ${rows}
      </div>`;
  }

  /* ================================================================
     SETTINGS MODAL
     ================================================================ */
  function openSettings() {
    document.getElementById("settingsModal").classList.add("open");
  }
  function closeSettings() {
    document.getElementById("settingsModal").classList.remove("open");
  }

  /* ================================================================
     TOAST NOTIFICATIONS
     ================================================================ */
  function showToast(message, type) {
    type = type || "success";
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOut .3s ease forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ================================================================
     GLOBAL EVENT BINDING
     ================================================================ */
  function bindGlobalEvents() {
    /* Nav tabs */
    document.getElementById("nav").addEventListener("click", e => {
      const tab = e.target.closest(".nav-tab");
      if (tab) switchTab(tab.dataset.tab);
    });

    /* Settings */
    document.getElementById("btnSettings").addEventListener("click", openSettings);
    document.getElementById("settingsClose").addEventListener("click", closeSettings);
    document.getElementById("settingsModal").addEventListener("click", e => {
      if (e.target === document.getElementById("settingsModal")) closeSettings();
    });
    document.getElementById("settingsSave").addEventListener("click", () => { showToast("Settings saved"); closeSettings(); });

    /* Target config events */
    document.getElementById("tab-targets").addEventListener("click", e => {
      /* Toggle individual/team */
      const toggleBtn = e.target.closest(".toggle-btn");
      if (toggleBtn) {
        state.configMode = toggleBtn.dataset.mode;
        renderConfigToggle();
        renderConfigSelfTarget();
        return;
      }
      /* Quarter pills */
      const qPill = e.target.closest("[data-quarter]");
      if (qPill) {
        state.configQuarter = qPill.dataset.quarter;
        renderConfigDetails();
        renderConfigSelfTarget();
        return;
      }
      /* Type pills */
      const tPill = e.target.closest("[data-type]");
      if (tPill) {
        state.configTargetType = tPill.dataset.type;
        renderConfigDetails();
        renderConfigSelfTarget();
        return;
      }
      /* Service chips */
      const chip = e.target.closest(".service-chip");
      if (chip) {
        const s = chip.dataset.service;
        if (state.selectedServices.includes(s)) {
          state.selectedServices = state.selectedServices.filter(x => x !== s);
        } else {
          state.selectedServices.push(s);
        }
        renderConfigDetails();
        return;
      }
      /* Save target */
      if (e.target.closest("#saveTargetBtn")) {
        const input = document.getElementById("targetAmountInput");
        const raw = input.value.replace(/[^0-9]/g, "");
        const amt = parseInt(raw, 10);
        if (isNaN(amt) || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
        const key = `${state.configPerson.id}_${state.configQuarter}_${state.configTargetType}`;
        state.targetAmounts[key] = amt;
        state.configPerson.target = amt;
        showToast(`Target saved: $${amt.toLocaleString()} for ${state.configQuarter} (${state.configTargetType})`);
        renderConfigSelfTarget();
        renderConfigCommission();
        renderConfigOrgTreeSection();
        return;
      }
    });

    /* Config BU select */
    document.addEventListener("change", e => {
      if (e.target.id === "configBUSelect") {
        state.configBU = e.target.value;
        state.selectedServices = [];
        renderConfigDetails();
      }
      if (e.target.id === "configCountrySelect") {
        state.configCountry = e.target.value;
        renderConfigDetails();
      }
    });

    /* Format target input */
    document.addEventListener("input", e => {
      if (e.target.id === "targetAmountInput") {
        let val = e.target.value.replace(/[^0-9]/g, "");
        if (val) e.target.value = parseInt(val, 10).toLocaleString();
      }
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
