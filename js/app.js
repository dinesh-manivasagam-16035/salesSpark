/**
 * Sales Spark — Main Application Logic
 * Vanilla JS, no dependencies.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

// ─── App State ────────────────────────────────────────────────────────────────
const AppState = {
  activeTab: 'dashboard',
  selectedQuarter: getCurrentFiscalQuarter(),
  selectedYear: 2025,
  configPerson: null,         // person being configured
  configQuarter: getCurrentFiscalQuarter(),
  configTargetType: 'Sales',
  configBU: Object.keys(BU_SERVICE_MAP)[0],
  configSelectedServices: [],
  configRegion: Object.keys(REGION_STATE_MAP)[0],
  configState: '',
  orgExpanded: {},            // node expansion state
  editingTarget: null,        // {nodeId, quarter}
  liveFilter: 'all',
};

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmt = n => '$' + (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(0));
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
}

// ─── Quarter / Date Logic ────────────────────────────────────────────────────
function getQuarterDates(q, year = AppState.selectedYear) {
  const map = {
    Q1: { start: new Date(year, 3, 1),  end: new Date(year, 5, 30) },
    Q2: { start: new Date(year, 6, 1),  end: new Date(year, 8, 30) },
    Q3: { start: new Date(year, 9, 1),  end: new Date(year, 11, 31) },
    Q4: { start: new Date(year + 1, 0, 1), end: new Date(year + 1, 2, 31) },
  };
  return map[q];
}

function workdaysLeft(q) {
  const { end } = getQuarterDates(q, AppState.selectedYear);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (today > end) return 0;
  let count = 0;
  const cur = new Date(today);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function workdaysInQuarter(q) {
  const { start, end } = getQuarterDates(q, AppState.selectedYear);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ─── Predictive Analytics ─────────────────────────────────────────────────────
function buildPredictiveInsight(node, quarter) {
  const target   = node.targets[quarter];
  const achieved = node.achieved[quarter];
  const remaining = Math.max(0, target - achieved);
  const daysLeft  = workdaysLeft(quarter);
  const totalDays = workdaysInQuarter(quarter);
  const elapsed   = totalDays - daysLeft;
  const pctDone   = pct(achieved, target);
  const pctLeft   = 100 - pctDone;
  const runRate   = elapsed > 0 ? achieved / elapsed : 0;
  const projected = runRate * totalDays;
  const reqRate   = daysLeft > 0 ? remaining / daysLeft : Infinity;
  const willHit   = projected >= target;

  let insight = '';
  if (pctLeft <= 0) {
    insight = `🎉 <strong>${node.name}</strong> has already hit their ${quarter} target!`;
  } else if (daysLeft === 0) {
    insight = `⌛ Quarter ended. <strong>${node.name}</strong> achieved ${pctDone}% of target.`;
  } else {
    insight = `You are <strong>${pctLeft}%</strong> away from the target. 
      To close the gap, generate <strong>${fmt(reqRate)}/day</strong> 
      over <strong>${daysLeft} working days</strong> left in ${quarter}.
      At current run rate you are projected to reach <strong>${fmt(projected)}</strong> — 
      ${willHit ? '<span class="tag-success">On Track ✓</span>' : '<span class="tag-danger">At Risk ✗</span>'}.`;
  }

  // Tier check
  const tier = COMMISSION_TIERS.slice().reverse().find(t => (achieved / target) >= t.threshold);
  const nextTier = COMMISSION_TIERS.find(t => t.threshold > (achieved / target));

  return { target, achieved, remaining, daysLeft, pctDone, reqRate, projected, willHit, insight, tier, nextTier };
}

// ─── Rollup Helpers ───────────────────────────────────────────────────────────
function rollup(node, q) {
  if (!node.reports || node.reports.length === 0) {
    return { target: node.targets[q] || 0, achieved: node.achieved[q] || 0 };
  }
  let t = 0, a = 0;
  node.reports.forEach(r => { const s = rollup(r, q); t += s.target; a += s.achieved; });
  return { target: t + (node.targets[q] || 0), achieved: a + (node.achieved[q] || 0) };
}

function teamRollup(q) {
  let t = 0, a = 0;
  ORG_HIERARCHY.forEach(dir => { const s = rollup(dir, q); t += s.target; a += s.achieved; });
  return { target: t, achieved: a };
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function renderDashboard() {
  const q = AppState.selectedQuarter;
  const { target, achieved } = teamRollup(q);
  const pipeline = PIPELINE_DATA[q];
  const retention = RETENTION_DATA[q];
  const atRisk = AT_RISK_DEALS.reduce((s, d) => s + d.value, 0);
  // Win rate = won deals / (won + lost) deals — closed-only ratio
  const winRate = pipeline ? pct(pipeline.won, pipeline.won + pipeline.lost) : 0;
  const totalWonDeals = WIN_RATE_BY_REGION.reduce((s, r) => s + r.won, 0);
  const dLeft = workdaysLeft(q);

  const el = qs('#tab-dashboard');
  el.innerHTML = `
    <!-- Metrics Row -->
    <div class="metrics-row">
      ${metricCard('Total Target', fmt(target), 'flag', '#1a7a5e', `FY${AppState.selectedYear} ${q}`)}
      ${metricCard('Revenue Achieved', fmt(achieved), 'trending-up', pct(achieved,target) >= 80 ? '#1a7a5e' : '#ef4444', pct(achieved,target) + '% of target', pct(achieved,target))}
      ${metricCard('Win Rate', winRate + '%', 'check-circle', winRate >= 65 ? '#2563eb' : '#e2a030', totalWonDeals + ' deals won')}
      ${metricCard('Pipeline', fmt(pipeline ? pipeline.total : 0), 'layers', '#9333ea', pipeline ? fmt(pipeline.open) + ' open' : '')}
      ${metricCard('At-Risk Deals', fmt(atRisk), 'alert-triangle', '#ef4444', AT_RISK_DEALS.length + ' deals flagged')}
      ${metricCard('Renewal Rate', Math.round(retention.renewalRate * 100) + '%', 'refresh-cw', '#0891b2', retention.churned + ' churned')}
    </div>

    <!-- Quarter Progress Bar -->
    <div class="card quarter-progress-card">
      <div class="card-header">
        <span class="card-title">${q} Progress — FY${AppState.selectedYear}</span>
        <span class="days-badge">${dLeft} working days left</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${Math.min(pct(achieved,target),100)}%"></div>
        </div>
        <div class="progress-labels">
          <span>${fmt(achieved)} achieved</span>
          <span class="${pct(achieved,target) >= 100 ? 'clr-success' : 'clr-muted'}">${pct(achieved,target)}%</span>
          <span>${fmt(target)} target</span>
        </div>
      </div>
      ${buildQuarterPrediction(q, target, achieved, dLeft)}
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <div class="card chart-card">
        <div class="card-header"><span class="card-title">Revenue Trend</span><span class="card-hint">Last 12 months</span></div>
        <div id="chart-revenue-trend"></div>
        <div class="chart-legend">
          <span class="legend-dot" style="background:#1a7a5e"></span> Revenue &nbsp;
          <span class="legend-dot" style="background:#e2a030; border-style: dashed"></span> Target
        </div>
      </div>
      <div class="card chart-card chart-card-sm">
        <div class="card-header"><span class="card-title">Win Rate by Region</span></div>
        <div id="chart-win-rate"></div>
      </div>
    </div>

    <!-- Product + Retention Row -->
    <div class="charts-row">
      <div class="card chart-card">
        <div class="card-header"><span class="card-title">Product Performance</span><span class="card-hint">Revenue + Growth</span></div>
        <div id="chart-products"></div>
      </div>
      <div class="card chart-card chart-card-sm">
        <div class="card-header"><span class="card-title">Customer Retention</span></div>
        ${renderRetentionPanel(q)}
      </div>
    </div>

    <!-- At-Risk Deals -->
    <div class="card">
      <div class="card-header"><span class="card-title">⚠️ At-Risk Deals</span><span class="tag-danger">${AT_RISK_DEALS.filter(d=>d.risk==='critical').length} Critical</span></div>
      <table class="data-table">
        <thead><tr><th>Deal</th><th>Rep</th><th>Value</th><th>Days Left</th><th>Risk</th></tr></thead>
        <tbody>
          ${AT_RISK_DEALS.map(d => `
            <tr>
              <td>${d.name}</td>
              <td>${d.rep}</td>
              <td class="fw-600">${fmt(d.value)}</td>
              <td>${d.daysLeft}d</td>
              <td><span class="risk-badge risk-${d.risk}">${d.risk.toUpperCase()}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Draw charts after DOM is ready
  requestAnimationFrame(() => {
    Charts.drawRevenueTrend('chart-revenue-trend', REVENUE_TREND);
    Charts.drawWinRateChart('chart-win-rate', WIN_RATE_BY_REGION);
    Charts.drawProductChart('chart-products', PRODUCT_PERFORMANCE);
  });
}

function metricCard(label, value, icon, color, sub = '', progress = null) {
  const iconSVG = getIcon(icon, color);
  const bar = progress !== null ? `<div class="metric-progress"><div style="width:${Math.min(progress,100)}%;background:${color}"></div></div>` : '';
  return `
    <div class="metric-card">
      <div class="metric-icon" style="background:${color}18">${iconSVG}</div>
      <div class="metric-body">
        <div class="metric-value" style="color:${color}">${value}</div>
        <div class="metric-label">${label}</div>
        ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
        ${bar}
      </div>
    </div>`;
}

function buildQuarterPrediction(q, target, achieved, dLeft) {
  const remaining = Math.max(0, target - achieved);
  const reqRate = dLeft > 0 ? remaining / dLeft : 0;
  const pctDone = pct(achieved, target);
  const pctLeft = Math.max(0, 100 - pctDone);
  if (pctLeft === 0) return `<div class="insight-box insight-success">🎉 Team has already hit the ${q} target!</div>`;
  if (dLeft === 0) return `<div class="insight-box insight-warning">⌛ Quarter ended at ${pctDone}% achievement.</div>`;
  return `
    <div class="insight-box${pctLeft > 20 ? ' insight-danger' : pctLeft > 10 ? ' insight-warning' : ' insight-success'}">
      <strong>📊 Predictive Insight:</strong> Team is <strong>${pctLeft}%</strong> away from ${q} target.
      To achieve it, generate <strong>${fmt(reqRate)}/day</strong> over
      <strong>${dLeft} working days</strong> (weekends excluded).
      Gap to close: <strong>${fmt(remaining)}</strong>.
    </div>`;
}

function renderRetentionPanel(q) {
  const r = RETENTION_DATA[q];
  const rate = Math.round(r.renewalRate * 100);
  return `
    <div class="retention-grid">
      <div class="ret-item">
        <div class="ret-val clr-success">${r.renewals}</div>
        <div class="ret-lbl">Renewals</div>
      </div>
      <div class="ret-item">
        <div class="ret-val clr-danger">${r.churned}</div>
        <div class="ret-lbl">Churned</div>
      </div>
      <div class="ret-item">
        <div class="ret-val">${rate}%</div>
        <div class="ret-lbl">Renewal Rate</div>
      </div>
      <div class="ret-item">
        <div class="ret-val clr-primary">${r.nrr.toFixed(2)}x</div>
        <div class="ret-lbl">NRR</div>
      </div>
    </div>
    <div class="progress-bar-wrap" style="margin-top:12px">
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${rate}%;background:#0891b2"></div>
      </div>
      <div class="progress-labels"><span>Churn: ${Math.round((1 - r.renewalRate)*100)}%</span><span>${rate}% Retained</span></div>
    </div>`;
}

// ─── Organization Tab ─────────────────────────────────────────────────────────
function renderOrganization() {
  const q = AppState.selectedQuarter;
  const el = qs('#tab-organization');
  el.innerHTML = `
    <div class="org-header">
      <h2 class="section-title">Organization Targets</h2>
      <div class="org-actions">
        <button class="btn btn-sm btn-outline" onclick="expandAllOrg()">Expand All</button>
        <button class="btn btn-sm btn-outline" onclick="collapseAllOrg()">Collapse All</button>
      </div>
    </div>
    <div class="card">
      <div id="org-tree">${renderOrgNodes(ORG_HIERARCHY, q, 0)}</div>
    </div>`;
}

function renderOrgNodes(nodes, q, depth) {
  return nodes.map(node => {
    const { target, achieved } = rollup(node, q);
    const progress = pct(achieved, target);
    const isLagging = progress < 70;
    const hasChildren = node.reports && node.reports.length > 0;
    const expanded = AppState.orgExpanded[node.id] !== false; // default expanded

    return `
      <div class="org-node depth-${depth} ${isLagging ? 'lagging' : ''}" data-id="${node.id}">
        <div class="org-node-header" onclick="toggleOrgNode('${node.id}')">
          ${hasChildren ? `<span class="tree-toggle ${expanded ? 'expanded' : ''}">${expanded ? '▾' : '▸'}</span>` : '<span class="tree-leaf">●</span>'}
          <div class="org-avatar" style="background:${avatarColor(node.name)}">${node.avatar}</div>
          <div class="org-node-info">
            <div class="org-name">${node.name} ${isLagging ? '<span class="lag-badge">Behind</span>' : ''}</div>
            <div class="org-role">${node.role} · ${node.region}</div>
          </div>
          <div class="org-targets">
            <div class="org-target-nums">
              <span class="org-achieved">${fmt(achieved)}</span>
              <span class="org-divider">/</span>
              <span class="org-target">${fmt(target)}</span>
            </div>
            <div class="mini-progress">
              <div class="mini-progress-fill ${isLagging ? 'danger' : ''}" style="width:${Math.min(progress, 100)}%"></div>
            </div>
            <div class="org-pct ${isLagging ? 'clr-danger' : 'clr-success'}">${progress}%</div>
          </div>
          <div class="org-q-targets">
            ${QUARTERS.map(qk => {
              const qp = pct(node.achieved[qk], node.targets[qk]);
              return `<div class="q-chip ${AppState.selectedQuarter === qk ? 'active' : ''}" title="${qk}: ${fmt(node.achieved[qk])} / ${fmt(node.targets[qk])}">${qk} <strong>${qp}%</strong></div>`;
            }).join('')}
          </div>
          <button class="btn btn-xs btn-teal" onclick="event.stopPropagation(); openTargetConfig('${node.id}')">Configure</button>
        </div>
        ${hasChildren && expanded ? `<div class="org-children">${renderOrgNodes(node.reports, q, depth + 1)}</div>` : ''}
      </div>`;
  }).join('');
}

function toggleOrgNode(id) {
  AppState.orgExpanded[id] = AppState.orgExpanded[id] === false ? true : false;
  renderOrganization();
}

function expandAllOrg() {
  getAllNodes(ORG_HIERARCHY).forEach(n => AppState.orgExpanded[n.id] = true);
  renderOrganization();
}

function collapseAllOrg() {
  getAllNodes(ORG_HIERARCHY).forEach(n => AppState.orgExpanded[n.id] = false);
  renderOrganization();
}

function avatarColor(name) {
  const colors = ['#1a7a5e','#2563eb','#9333ea','#e2a030','#0891b2','#ef4444','#0d9488'];
  let hash = 0;
  for (let c of name) hash = (hash << 5) - hash + c.charCodeAt(0);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Leaderboard Tab ─────────────────────────────────────────────────────────
function renderLeaderboard() {
  const q = AppState.selectedQuarter;
  const reps = getAllReps(ORG_HIERARCHY);
  const ranked = reps.map(r => {
    const achieved = r.achieved[q] || 0;
    const target   = r.targets[q] || 1;
    const pctVal   = pct(achieved, target);
    const insight  = buildPredictiveInsight(r, q);
    return { ...r, achieved, target, pctVal, insight };
  }).sort((a, b) => b.pctVal - a.pctVal);

  const el = qs('#tab-leaderboard');
  el.innerHTML = `
    <div class="lb-header">
      <h2 class="section-title">Team Leaderboard — ${q} FY${AppState.selectedYear}</h2>
    </div>

    <!-- Podium Top 3 -->
    <div class="podium">
      ${podiumCard(ranked[1], 2)}
      ${podiumCard(ranked[0], 1)}
      ${podiumCard(ranked[2], 3)}
    </div>

    <!-- Full Table -->
    <div class="card">
      <table class="data-table lb-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Rep</th>
            <th>Region</th>
            <th>BU</th>
            <th>Achieved</th>
            <th>Target</th>
            <th>Attainment</th>
            <th>Progress</th>
            <th>Tier</th>
            <th>Insight</th>
          </tr>
        </thead>
        <tbody>
          ${ranked.map((r, i) => {
            const tier = COMMISSION_TIERS.slice().reverse().find(t => (r.achieved / r.target) >= t.threshold);
            const tierColors = { Base: '#64748b', Accelerate: '#2563eb', Turbo: '#9333ea', Elite: '#e2a030' };
            return `
              <tr class="${i < 3 ? 'top-rep' : ''} ${r.pctVal < 70 ? 'lagging-rep' : ''}">
                <td><span class="rank-badge rank-${i + 1}">${i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</span></td>
                <td>
                  <div class="rep-cell">
                    <div class="rep-avatar" style="background:${avatarColor(r.name)}">${r.avatar}</div>
                    <div>
                      <div class="rep-name">${r.name}</div>
                      <div class="rep-role clr-muted">${r.role}</div>
                    </div>
                  </div>
                </td>
                <td>${r.region}</td>
                <td>${r.bu}</td>
                <td class="fw-600 clr-primary">${fmt(r.achieved)}</td>
                <td>${fmt(r.target)}</td>
                <td class="fw-700 ${r.pctVal >= 100 ? 'clr-success' : r.pctVal >= 70 ? 'clr-primary' : 'clr-danger'}">${r.pctVal}%</td>
                <td style="min-width:100px">
                  <div class="bar-wrap"><div class="bar-fill ${r.pctVal < 70 ? 'danger' : ''}" style="width:${Math.min(r.pctVal, 100)}%"></div></div>
                </td>
                <td><span class="tier-badge" style="background:${tierColors[tier.label]}20;color:${tierColors[tier.label]}">${tier.label}</span></td>
                <td class="insight-cell"><span title="${stripHTML(r.insight.insight)}">${r.pctVal >= 100 ? '✓ Done' : r.insight.daysLeft + 'd • ' + fmt(r.insight.reqRate) + '/d'}</span></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Individual Prediction Cards -->
    <div class="predict-grid">
      ${ranked.slice(0, 6).map(r => renderPredictCard(r)).join('')}
    </div>
  `;
}

function podiumCard(rep, rank) {
  if (!rep) return '<div class="podium-slot"></div>';
  const q = AppState.selectedQuarter;
  const icons = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return `
    <div class="podium-slot podium-${rank}">
      <div class="podium-crown">${icons[rank]}</div>
      <div class="podium-avatar" style="background:${avatarColor(rep.name)}">${rep.avatar}</div>
      <div class="podium-name">${rep.name}</div>
      <div class="podium-role clr-muted">${rep.role}</div>
      <div class="podium-val">${fmt(rep.achieved)}</div>
      <div class="podium-pct ${rep.pctVal >= 100 ? 'clr-success' : 'clr-primary'}">${rep.pctVal}%</div>
      <div class="podium-block rank-block-${rank}"></div>
    </div>`;
}

function renderPredictCard(r) {
  const ins = r.insight;
  const tierColors = { Base: '#64748b', Accelerate: '#2563eb', Turbo: '#9333ea', Elite: '#e2a030' };
  const tier = COMMISSION_TIERS.slice().reverse().find(t => (r.achieved / r.target) >= t.threshold);
  const nextTier = COMMISSION_TIERS.find(t => t.threshold > (r.achieved / r.target));
  const toNext = nextTier ? fmt(nextTier.threshold * r.target - r.achieved) + ' to ' + nextTier.label : 'Elite ✓';

  return `
    <div class="predict-card ${ins.willHit ? '' : 'predict-atrisk'}">
      <div class="predict-header">
        <div class="rep-avatar sm" style="background:${avatarColor(r.name)}">${r.avatar}</div>
        <div>
          <div class="fw-600">${r.name}</div>
          <div class="clr-muted" style="font-size:11px">${r.role}</div>
        </div>
        <span class="tier-badge ml-auto" style="background:${tierColors[tier.label]}20;color:${tierColors[tier.label]}">${tier.label}</span>
      </div>
      <div class="predict-progress">
        <div class="predict-bar-track">
          <div class="predict-bar-fill" style="width:${Math.min(ins.pctDone,100)}%;background:${ins.willHit?'#1a7a5e':'#ef4444'}"></div>
        </div>
        <div class="predict-pct">${ins.pctDone}%</div>
      </div>
      <div class="predict-nums">
        <span>${fmt(r.achieved)} <span class="clr-muted">of</span> ${fmt(r.target)}</span>
        <span class="clr-muted">${ins.daysLeft}d left</span>
      </div>
      <div class="predict-rate ${ins.willHit ? 'clr-success' : 'clr-danger'}">
        Required: ${isFinite(ins.reqRate) ? fmt(ins.reqRate) + '/day' : 'N/A'}
      </div>
      <div class="predict-next clr-muted">🔥 ${toNext}</div>
    </div>`;
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function renderAnalytics() {
  const el = qs('#tab-analytics');
  const quarters = QUARTERS;

  el.innerHTML = `
    <h2 class="section-title">Performance Analytics</h2>

    <div class="charts-row">
      <div class="card chart-card" style="flex:1">
        <div class="card-header"><span class="card-title">Revenue vs Target — All Quarters</span></div>
        <div id="chart-all-quarters"></div>
      </div>
      <div class="card chart-card chart-card-sm">
        <div class="card-header"><span class="card-title">Pipeline Breakdown</span></div>
        <div id="chart-pipeline-donut" style="display:flex;justify-content:center;padding:12px 0"></div>
        <div class="pipeline-legend">
          ${[['#1a7a5e','Won'],['#e2a030','Open'],['#ef4444','Lost']].map(([c,l])=>`<span><span class="legend-dot" style="background:${c}"></span>${l}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="card chart-card">
        <div class="card-header"><span class="card-title">Win Rate by Region</span></div>
        <div id="chart-win-rate-2"></div>
      </div>
      <div class="card chart-card">
        <div class="card-header"><span class="card-title">Product Revenue Distribution</span></div>
        <div id="chart-products-2"></div>
      </div>
    </div>

    <!-- Quarterly Summary Table -->
    <div class="card">
      <div class="card-header"><span class="card-title">Quarterly Summary</span></div>
      <table class="data-table">
        <thead><tr><th>Quarter</th><th>Target</th><th>Achieved</th><th>Attainment</th><th>Renewals</th><th>Churn</th><th>NRR</th><th>Win Rate</th></tr></thead>
        <tbody>
          ${quarters.map(qk => {
            const { target, achieved } = teamRollup(qk);
            const att = pct(achieved, target);
            const ret = RETENTION_DATA[qk];
            const pip = PIPELINE_DATA[qk];
            const wr = pct(pip.won, pip.won + pip.lost);
            return `
              <tr class="${AppState.selectedQuarter === qk ? 'active-row' : ''}">
                <td><strong>${qk}</strong></td>
                <td>${fmt(target)}</td>
                <td class="fw-600">${fmt(achieved)}</td>
                <td class="fw-700 ${att>=100?'clr-success':att>=70?'clr-primary':'clr-danger'}">${att}%</td>
                <td class="clr-success">${ret.renewals}</td>
                <td class="clr-danger">${ret.churned}</td>
                <td class="clr-primary">${ret.nrr.toFixed(2)}x</td>
                <td>${wr}%</td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  requestAnimationFrame(() => {
    drawAllQuartersChart();
    const pData = PIPELINE_DATA[AppState.selectedQuarter];
    if (pData) {
      Charts.drawDonut('chart-pipeline-donut', [
        { value: pData.won, color: '#1a7a5e' },
        { value: pData.open, color: '#e2a030' },
        { value: pData.lost, color: '#ef4444' },
      ], Math.round(pct(pData.won, pData.won + pData.lost)) + '%');
    }
    Charts.drawWinRateChart('chart-win-rate-2', WIN_RATE_BY_REGION);
    Charts.drawProductChart('chart-products-2', PRODUCT_PERFORMANCE);
  });
}

function drawAllQuartersChart() {
  const container = qs('#chart-all-quarters');
  if (!container) return;
  container.innerHTML = '';

  const quarters = QUARTERS;
  const data = quarters.map(q => {
    const r = teamRollup(q);
    return { q, target: r.target, achieved: r.achieved };
  });

  const W = container.clientWidth || 560;
  const H = 200;
  const pad = { top: 20, right: 20, bottom: 40, left: 70 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;
  const barW = (cW / data.length) * 0.35;
  const gap   = (cW / data.length);

  const maxVal = Math.max(...data.flatMap(d => [d.target, d.achieved])) * 1.1;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + cH - (i / 4) * cH;
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', pad.left); line.setAttribute('y1', y);
    line.setAttribute('x2', pad.left + cW); line.setAttribute('y2', y);
    line.setAttribute('stroke', '#e8ecf0'); line.setAttribute('stroke-width', 1);
    svg.appendChild(line);

    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', pad.left - 6); lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end'); lbl.setAttribute('fill', '#94a3b8');
    lbl.setAttribute('font-size', 10);
    lbl.textContent = fmt(maxVal * i / 4);
    svg.appendChild(lbl);
  }

  data.forEach((d, i) => {
    const cx = pad.left + i * gap + gap / 2;
    const targetH = (d.target / maxVal) * cH;
    const achievedH = (d.achieved / maxVal) * cH;

    // Target bar (ghost)
    const tb = document.createElementNS(svgNS, 'rect');
    tb.setAttribute('x', cx - barW); tb.setAttribute('y', pad.top + cH - targetH);
    tb.setAttribute('width', barW); tb.setAttribute('height', targetH);
    tb.setAttribute('rx', 4); tb.setAttribute('fill', '#e8ecf0');
    svg.appendChild(tb);

    // Achieved bar
    const ab = document.createElementNS(svgNS, 'rect');
    const color = d.achieved >= d.target ? '#1a7a5e' : d.achieved / d.target >= 0.7 ? '#e2a030' : '#ef4444';
    ab.setAttribute('x', cx); ab.setAttribute('y', pad.top + cH - achievedH);
    ab.setAttribute('width', barW); ab.setAttribute('height', achievedH);
    ab.setAttribute('rx', 4); ab.setAttribute('fill', color); ab.setAttribute('opacity', 0.85);
    svg.appendChild(ab);

    // Q label
    const lbl = document.createElementNS(svgNS, 'text');
    lbl.setAttribute('x', cx); lbl.setAttribute('y', H - 8);
    lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('fill', '#64748b');
    lbl.setAttribute('font-size', 11); lbl.setAttribute('font-weight', AppState.selectedQuarter === d.q ? 700 : 400);
    lbl.textContent = d.q;
    svg.appendChild(lbl);
  });

  // Legend
  [['#e8ecf0', 'Target'], ['#1a7a5e', 'Achieved']].forEach(([c, l], i) => {
    const lx = pad.left + i * 100;
    const r = document.createElementNS(svgNS, 'rect');
    r.setAttribute('x', lx); r.setAttribute('y', H - 6);
    r.setAttribute('width', 12); r.setAttribute('height', 8); r.setAttribute('rx', 2);
    r.setAttribute('fill', c);
    const t = document.createElementNS(svgNS, 'text');
    t.setAttribute('x', lx + 16); t.setAttribute('y', H - 0);
    t.setAttribute('fill', '#64748b'); t.setAttribute('font-size', 10);
    t.textContent = l;
    // svg.appendChild(r); svg.appendChild(t);
  });

  container.appendChild(svg);
}

// ─── Configuration Tab ────────────────────────────────────────────────────────
function renderConfiguration() {
  const el = qs('#tab-configuration');
  const allPeople = getAllNodes(ORG_HIERARCHY);
  const person = AppState.configPerson || allPeople[0];
  const bu = AppState.configBU;
  const services = BU_SERVICE_MAP[bu] || [];
  const region = AppState.configRegion;
  const statesList = REGION_STATE_MAP[region]?.states || [];
  const q = AppState.configQuarter;
  const tt = AppState.configTargetType;

  el.innerHTML = `
    <div class="config-layout">
      <!-- LEFT: People Picker -->
      <div class="config-sidebar">
        <div class="card" style="padding:0;overflow:hidden">
          <div class="config-sidebar-header">Select Person</div>
          <div class="config-people-list">
            ${allPeople.map(p => `
              <div class="config-person-item ${AppState.configPerson?.id === p.id ? 'active' : ''}"
                   onclick="selectConfigPerson('${p.id}')">
                <div class="rep-avatar sm" style="background:${avatarColor(p.name)}">${p.avatar}</div>
                <div>
                  <div class="fw-500">${p.name}</div>
                  <div class="clr-muted" style="font-size:11px">${p.role}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- RIGHT: Config Form -->
      <div class="config-main">
        <div class="card config-form-card">
          <!-- Person Header -->
          <div class="config-person-header">
            <div class="rep-avatar lg" style="background:${avatarColor(person.name)}">${person.avatar}</div>
            <div>
              <div class="config-person-name">${person.name}</div>
              <div class="config-person-role">${person.role}</div>
              <div class="clr-muted" style="font-size:12px">Reports to: <strong>${getReportsTo(person.id)}</strong></div>
            </div>
          </div>

          <!-- Individual / Team Toggle -->
          <div class="toggle-tabs">
            <button class="toggle-tab active" data-view="individual">👤 Individual</button>
            <button class="toggle-tab" data-view="team">👥 Team Rollup</button>
          </div>

          <!-- Target Details Section -->
          <div class="config-section">
            <div class="config-section-title">🏷️ TARGET DETAILS</div>

            <!-- Quarter -->
            <div class="config-field-label">Quarter</div>
            <div class="seg-group">
              ${QUARTERS.map(qk => `
                <button class="seg-btn ${q === qk ? 'active' : ''}"
                        onclick="setConfigQuarter('${qk}')">${qk}</button>`).join('')}
            </div>

            <!-- Target Type -->
            <div class="config-field-label" style="margin-top:16px">Target Type</div>
            <div class="seg-group">
              ${['Sales','Partner','Renewal'].map(t => `
                <button class="seg-btn ${tt === t ? 'active' : ''}"
                        onclick="setConfigTargetType('${t}')">${t}</button>`).join('')}
            </div>

            <!-- BU Group -->
            <div class="config-field-label" style="margin-top:16px">BU Group</div>
            <select class="form-select" onchange="setConfigBU(this.value)">
              ${Object.keys(BU_SERVICE_MAP).map(b =>
                `<option value="${b}" ${b === bu ? 'selected' : ''}>${b}</option>`).join('')}
            </select>

            <!-- Services -->
            <div class="config-field-label" style="margin-top:16px">
              Services <span class="clr-muted">(${AppState.configSelectedServices.length} selected)</span>
            </div>
            <div class="services-chips" id="services-chips">
              ${services.map(s => `
                <span class="service-chip ${AppState.configSelectedServices.includes(s) ? 'selected' : ''}"
                      onclick="toggleService('${s}')">${s}</span>`).join('')}
            </div>

            <!-- Region / State -->
            <div class="config-field-label" style="margin-top:16px">🌐 Region / State</div>
            <div class="country-state-row">
              <select class="form-select" onchange="setConfigRegion(this.value)">
                ${Object.keys(REGION_STATE_MAP).map(r =>
                  `<option value="${r}" ${r === region ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
              <select class="form-select" onchange="AppState.configState = this.value">
                <option value="">Select State / Territory</option>
                ${statesList.map(s =>
                  `<option value="${s}" ${s === AppState.configState ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div style="margin-top:6px">
              Country: <span class="region-tag">${REGION_STATE_MAP[region]?.country || region}</span>
            </div>
          </div>

          <!-- Reporting Manager -->
          <div class="config-section">
            <div class="config-section-title">👥 REPORTING MANAGER</div>
            <select class="form-select">
              ${getAllNodes(ORG_HIERARCHY).filter(n => n.id !== person.id).map(n =>
                `<option ${getReportsTo(person.id) === n.name ? 'selected' : ''}>${n.name} (${n.role})</option>`).join('')}
            </select>
          </div>

          <!-- Self Target -->
          <div class="config-section">
            <div class="config-section-title">👤 Self Target</div>
            <div class="clr-muted" style="font-size:12px;margin-bottom:8px">Direct contribution — not from team rollup.</div>
            <div class="self-target-row">
              <span class="dollar-sign">$</span>
              <input type="number" class="target-input" id="self-target-input"
                     value="${person.targets[q] || 0}"
                     placeholder="Enter target amount" />
              <button class="btn btn-teal save-btn" onclick="savePersonTarget('${person.id}', '${q}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              </button>
            </div>
          </div>

          <!-- Team Rollup Summary -->
          <div class="config-section">
            <div class="config-section-title">📊 TEAM ROLLUP SUMMARY</div>
            ${renderRollupSummary(person, q)}
          </div>
        </div>
      </div>
    </div>
  `;

  // Toggle tabs
  qsa('.toggle-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      qsa('.toggle-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

function renderRollupSummary(person, q) {
  const { target, achieved } = rollup(person, q);
  const progress = pct(achieved, target);
  return `
    <div class="rollup-grid">
      ${QUARTERS.map(qk => {
        const r = rollup(person, qk);
        const p = pct(r.achieved, r.target);
        return `
          <div class="rollup-q-card ${AppState.configQuarter === qk ? 'active' : ''}">
            <div class="rollup-q-label">${qk}</div>
            <div class="rollup-q-val fw-700">${fmt(r.achieved)}</div>
            <div class="clr-muted" style="font-size:11px">of ${fmt(r.target)}</div>
            <div class="mini-progress" style="margin-top:6px">
              <div class="mini-progress-fill ${p < 70 ? 'danger' : ''}" style="width:${Math.min(p,100)}%"></div>
            </div>
            <div class="${p<70?'clr-danger':'clr-success'}" style="font-size:11px;margin-top:2px">${p}%</div>
          </div>`;
      }).join('')}
    </div>`;
}

function getReportsTo(id) {
  function search(nodes, target) {
    for (const n of nodes) {
      if (n.reports?.find(r => r.id === target)) return n.name;
      if (n.reports?.length) { const found = search(n.reports, target); if (found) return found; }
    }
    return '—';
  }
  return search(ORG_HIERARCHY, id);
}

function selectConfigPerson(id) {
  const person = getAllNodes(ORG_HIERARCHY).find(n => n.id === id);
  if (person) { AppState.configPerson = person; renderConfiguration(); }
}

function setConfigQuarter(q) { AppState.configQuarter = q; renderConfiguration(); }
function setConfigTargetType(t) { AppState.configTargetType = t; renderConfiguration(); }
function setConfigBU(bu) {
  AppState.configBU = bu;
  AppState.configSelectedServices = [];
  renderConfiguration();
}

function setConfigRegion(region) {
  AppState.configRegion = region;
  AppState.configState = '';
  renderConfiguration();
}

function toggleService(s) {
  const idx = AppState.configSelectedServices.indexOf(s);
  if (idx >= 0) AppState.configSelectedServices.splice(idx, 1);
  else AppState.configSelectedServices.push(s);
  // Re-render chips only
  const chips = qs('#services-chips');
  if (chips) {
    const services = BU_SERVICE_MAP[AppState.configBU] || [];
    chips.innerHTML = services.map(sv => `
      <span class="service-chip ${AppState.configSelectedServices.includes(sv) ? 'selected' : ''}"
            onclick="toggleService('${sv}')">${sv}</span>`).join('');
    const label = chips.previousElementSibling;
    if (label) label.innerHTML = `Services <span class="clr-muted">(${AppState.configSelectedServices.length} selected)</span>`;
  }
}

function savePersonTarget(id, q) {
  const input = qs('#self-target-input');
  if (!input) return;
  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0) { toast('Invalid amount', 'error'); return; }

  const node = getAllNodes(ORG_HIERARCHY).find(n => n.id === id);
  if (node) {
    node.targets[q] = val;
    toast(`Target saved: ${fmt(val)} for ${node.name} — ${q}`, 'success');
    // Refresh any active org/leaderboard if needed
    if (AppState.activeTab === 'organization') renderOrganization();
    if (AppState.activeTab === 'leaderboard') renderLeaderboard();
  }
}

function openTargetConfig(id) {
  const person = getAllNodes(ORG_HIERARCHY).find(n => n.id === id);
  if (!person) return;
  AppState.configPerson = person;
  switchTab('configuration');
}

// ─── Live Feed Tab ────────────────────────────────────────────────────────────
function renderLiveFeed() {
  const el = qs('#tab-livefeed');
  const filter = AppState.liveFilter;
  const events = filter === 'all' ? LIVE_FEED_EVENTS : LIVE_FEED_EVENTS.filter(e => e.type === filter);

  el.innerHTML = `
    <div class="feed-header">
      <h2 class="section-title">Live Feed</h2>
      <div class="feed-filters">
        ${[['all','All'],['deal_won','Wins'],['alert','Alerts'],['renewal','Renewals'],['deal_lost','Losses']].map(([k,l]) =>
          `<button class="feed-filter-btn ${filter===k?'active':''}" onclick="setLiveFilter('${k}')">${l}</button>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="feed-list">
        ${events.map(e => `
          <div class="feed-item feed-${e.type}">
            <div class="feed-icon">${e.icon}</div>
            <div class="feed-body">
              <div class="feed-msg"><strong>${e.user}</strong> — ${e.msg}${e.value ? ` <span class="feed-value">${fmt(e.value)}</span>` : ''}</div>
              <div class="feed-time">${e.time}</div>
            </div>
            <div class="feed-type-tag">${e.type.replace('_', ' ')}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

function setLiveFilter(f) { AppState.liveFilter = f; renderLiveFeed(); }

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function switchTab(tabId) {
  AppState.activeTab = tabId;

  // Header tabs
  qsa('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));

  // Tab panes
  qsa('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tabId));

  // Render content
  const renders = {
    dashboard: renderDashboard,
    organization: renderOrganization,
    leaderboard: renderLeaderboard,
    analytics: renderAnalytics,
    configuration: renderConfiguration,
    livefeed: renderLiveFeed,
  };
  if (renders[tabId]) renders[tabId]();
}

// ─── Quarter Toggle ───────────────────────────────────────────────────────────
function setQuarter(q) {
  AppState.selectedQuarter = q;
  qsa('.q-toggle').forEach(b => b.classList.toggle('active', b.dataset.q === q));
  // Re-render current tab
  switchTab(AppState.activeTab);
}

// ─── Header Settings Modal ────────────────────────────────────────────────────
function openSettings() {
  const modal = qs('#settings-modal');
  if (modal) modal.classList.add('open');
}

function closeSettings() {
  const modal = qs('#settings-modal');
  if (modal) modal.classList.remove('open');
}

// ─── Icon helper (inline SVG snippets) ───────────────────────────────────────
function getIcon(name, color = '#1a7a5e') {
  const icons = {
    'flag': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
    'trending-up': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    'check-circle': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    'layers': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    'alert-triangle': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    'refresh-cw': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    'settings': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };
  return icons[name] || '';
}

function stripHTML(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}

// ─── Boot ────────────────────────────────────────────────────────────────────
function init() {
  // Quarter toggles
  qsa('.q-toggle').forEach(btn => {
    btn.addEventListener('click', () => setQuarter(btn.dataset.q));
  });

  // Nav
  qsa('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Settings button
  const settingsBtn = qs('#settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  const closeBtn = qs('#settings-close');
  if (closeBtn) closeBtn.addEventListener('click', closeSettings);
  const modalBg = qs('#settings-modal');
  if (modalBg) modalBg.addEventListener('click', e => { if (e.target === modalBg) closeSettings(); });

  // Year selector
  const yearSel = qs('#year-select');
  if (yearSel) yearSel.addEventListener('change', () => {
    AppState.selectedYear = parseInt(yearSel.value);
    switchTab(AppState.activeTab);
  });

  // Set current quarter active toggle
  qsa('.q-toggle').forEach(b => b.classList.toggle('active', b.dataset.q === AppState.selectedQuarter));

  // Initial render
  switchTab('dashboard');

  // Live feed ticker
  setInterval(addLiveFeedTick, 30000);
}

function addLiveFeedTick() {
  const ticks = [
    { id: Date.now(), type: 'deal_won', time: 'just now', user: 'Arjun Sharma', msg: 'New deal signed — BFSI Analytics', value: 210000, icon: '🏆' },
    { id: Date.now(), type: 'alert',    time: 'just now', user: 'System',       msg: 'Q4 target pacing below forecast', value: null,   icon: '⚠️' },
    { id: Date.now(), type: 'renewal',  time: 'just now', user: 'Wei Zhang',    msg: 'APAC renewal confirmed',          value: 145000, icon: '🔄' },
  ];
  const pick = ticks[Math.floor(Math.random() * ticks.length)];
  LIVE_FEED_EVENTS.unshift(pick);
  if (LIVE_FEED_EVENTS.length > 30) LIVE_FEED_EVENTS.pop();
  if (AppState.activeTab === 'livefeed') renderLiveFeed();

  // Notification dot
  const dot = qs('#feed-dot');
  if (dot && AppState.activeTab !== 'livefeed') dot.classList.add('show');
}

document.addEventListener('DOMContentLoaded', init);
