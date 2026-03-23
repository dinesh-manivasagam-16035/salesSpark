/**
 * Sales Spark — SVG/Canvas Chart Rendering
 * All charts drawn with vanilla SVG — no libraries.
 */

const Charts = (() => {

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function formatK(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
    return '$' + n;
  }

  function lightenColor(hex, amount) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, r + amount);
    const ng = Math.min(255, g + amount);
    const nb = Math.min(255, b + amount);
    return `rgb(${nr},${ng},${nb})`;
  }

  // ─── Revenue Trend Line Chart ─────────────────────────────────────────────
  function drawRevenueTrend(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const W = container.clientWidth || 560;
    const H = 220;
    const pad = { top: 20, right: 20, bottom: 40, left: 60 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });

    // Grid
    const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.target))) * 1.15;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + cH - (i / gridLines) * cH;
      const line = svgEl('line', {
        x1: pad.left, y1: y, x2: pad.left + cW, y2: y,
        stroke: '#e8ecf0', 'stroke-width': 1
      });
      const lbl = svgEl('text', {
        x: pad.left - 8, y: y + 4,
        'text-anchor': 'end', fill: '#94a3b8', 'font-size': 10
      });
      lbl.textContent = formatK((maxVal * i / gridLines));
      svg.appendChild(line);
      svg.appendChild(lbl);
    }

    // X labels
    const step = cW / (data.length - 1);
    data.forEach((d, i) => {
      const x = pad.left + i * step;
      const lbl = svgEl('text', {
        x, y: H - 8,
        'text-anchor': 'middle', fill: '#94a3b8', 'font-size': 10
      });
      lbl.textContent = d.month;
      svg.appendChild(lbl);
    });

    // Area fill for revenue
    const toY = v => pad.top + cH - (v / maxVal) * cH;
    const toX = i => pad.left + i * step;

    let areaPath = `M ${toX(0)} ${toY(data[0].revenue)}`;
    data.forEach((d, i) => { if (i > 0) areaPath += ` L ${toX(i)} ${toY(d.revenue)}`; });
    areaPath += ` L ${toX(data.length - 1)} ${pad.top + cH} L ${toX(0)} ${pad.top + cH} Z`;

    const grad = svgEl('defs');
    grad.innerHTML = `
      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a7a5e" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#1a7a5e" stop-opacity="0.01"/>
      </linearGradient>`;
    svg.appendChild(grad);

    const area = svgEl('path', { d: areaPath, fill: 'url(#revGrad)' });
    svg.appendChild(area);

    // Target dashed line
    let targetPath = '';
    data.forEach((d, i) => {
      targetPath += i === 0 ? `M ${toX(i)} ${toY(d.target)}` : ` L ${toX(i)} ${toY(d.target)}`;
    });
    const tLine = svgEl('path', {
      d: targetPath, fill: 'none', stroke: '#e2a030',
      'stroke-width': 1.5, 'stroke-dasharray': '5,3'
    });
    svg.appendChild(tLine);

    // Revenue line
    let revPath = '';
    data.forEach((d, i) => {
      revPath += i === 0 ? `M ${toX(i)} ${toY(d.revenue)}` : ` L ${toX(i)} ${toY(d.revenue)}`;
    });
    const rLine = svgEl('path', {
      d: revPath, fill: 'none', stroke: '#1a7a5e', 'stroke-width': 2.5,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    });
    svg.appendChild(rLine);

    // Dots with tooltip data
    data.forEach((d, i) => {
      const cx = toX(i);
      const cy = toY(d.revenue);
      const dot = svgEl('circle', {
        cx, cy, r: 4, fill: '#1a7a5e', stroke: '#fff', 'stroke-width': 2,
        class: 'chart-dot', 'data-tip': `${d.month}: ${formatK(d.revenue)}`
      });
      svg.appendChild(dot);
    });

    // Legend
    const lgY = H - 6;
    [['#1a7a5e', 'Revenue'], ['#e2a030', 'Target']].forEach(([color, label], i) => {
      const lx = pad.left + i * 110;
      const rect = svgEl('rect', { x: lx, y: lgY - 8, width: 16, height: 3, fill: color, rx: 2 });
      const txt = svgEl('text', { x: lx + 20, y: lgY, fill: '#64748b', 'font-size': 10 });
      txt.textContent = label;
      // svg.appendChild(rect); // place at bottom
      // svg.appendChild(txt);
    });

    container.appendChild(svg);
  }

  // ─── Win Rate Horizontal Bar Chart ───────────────────────────────────────
  function drawWinRateChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const W = container.clientWidth || 480;
    const rowH = 38;
    const H = data.length * rowH + 20;
    const labelW = 110;
    const barMaxW = W - labelW - 70;

    const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });

    const colors = ['#1a7a5e', '#2563eb', '#9333ea', '#e2a030', '#ef4444'];

    data.forEach((d, i) => {
      const y = i * rowH + 10;
      const barW = (d.winRate / 100) * barMaxW;

      // BG bar
      const bg = svgEl('rect', {
        x: labelW, y: y + 6, width: barMaxW, height: 18,
        rx: 9, fill: '#f1f5f9'
      });
      // Filled bar
      const bar = svgEl('rect', {
        x: labelW, y: y + 6, width: barW, height: 18,
        rx: 9, fill: colors[i % colors.length], opacity: 0.85
      });
      // Label
      const lbl = svgEl('text', {
        x: labelW - 8, y: y + 19,
        'text-anchor': 'end', fill: '#374151', 'font-size': 11, 'font-weight': 500
      });
      lbl.textContent = d.region;
      // Value
      const val = svgEl('text', {
        x: labelW + barW + 8, y: y + 19,
        fill: colors[i % colors.length], 'font-size': 11, 'font-weight': 600
      });
      val.textContent = d.winRate + '%';

      svg.appendChild(bg);
      svg.appendChild(bar);
      svg.appendChild(lbl);
      svg.appendChild(val);
    });

    container.appendChild(svg);
  }

  // ─── Product Performance Bubble / Bar Chart ───────────────────────────────
  function drawProductChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const W = container.clientWidth || 520;
    const rowH = 34;
    const H = data.length * rowH + 30;
    const labelW = 180;
    const barMaxW = W - labelW - 90;
    const maxRev = Math.max(...data.map(d => d.revenue));

    const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });

    data.forEach((d, i) => {
      const y = i * rowH + 14;
      const barW = (d.revenue / maxRev) * barMaxW;
      const isGrowth = d.growth > 30;
      const barColor = isGrowth ? '#9333ea' : d.growth > 15 ? '#2563eb' : '#1a7a5e';

      const bg = svgEl('rect', { x: labelW, y: y + 3, width: barMaxW, height: 16, rx: 8, fill: '#f1f5f9' });
      const bar = svgEl('rect', { x: labelW, y: y + 3, width: barW, height: 16, rx: 8, fill: barColor, opacity: 0.82 });

      const lbl = svgEl('text', { x: labelW - 8, y: y + 15, 'text-anchor': 'end', fill: '#374151', 'font-size': 10.5 });
      lbl.textContent = d.product.length > 20 ? d.product.slice(0, 18) + '…' : d.product;

      const rev = svgEl('text', { x: labelW + barW + 8, y: y + 15, fill: '#374151', 'font-size': 10 });
      rev.textContent = formatK(d.revenue);

      const growth = svgEl('text', { x: W - 8, y: y + 15, 'text-anchor': 'end', fill: d.growth >= 0 ? '#1a7a5e' : '#ef4444', 'font-size': 10, 'font-weight': 600 });
      growth.textContent = (d.growth >= 0 ? '+' : '') + d.growth + '%';

      svg.appendChild(bg);
      svg.appendChild(bar);
      svg.appendChild(lbl);
      svg.appendChild(rev);
      svg.appendChild(growth);
    });

    container.appendChild(svg);
  }

  // ─── Donut Chart ─────────────────────────────────────────────────────────
  function drawDonut(containerId, segments, label = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const SIZE = Math.min(container.clientWidth || 160, 160);
    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE * 0.38, inner = SIZE * 0.24;
    const svg = svgEl('svg', { width: SIZE, height: SIZE, viewBox: `0 0 ${SIZE} ${SIZE}` });

    const total = segments.reduce((a, b) => a + b.value, 0);
    let startAngle = -Math.PI / 2;

    segments.forEach(seg => {
      const angle = (seg.value / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(startAngle + angle);
      const y2 = cy + r * Math.sin(startAngle + angle);
      const large = angle > Math.PI ? 1 : 0;

      const ix1 = cx + inner * Math.cos(startAngle);
      const iy1 = cy + inner * Math.sin(startAngle);
      const ix2 = cx + inner * Math.cos(startAngle + angle);
      const iy2 = cy + inner * Math.sin(startAngle + angle);

      const path = svgEl('path', {
        d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`,
        fill: seg.color, opacity: 0.88
      });
      svg.appendChild(path);
      startAngle += angle;
    });

    // Center label
    if (label) {
      const txt = svgEl('text', {
        x: cx, y: cy + 4, 'text-anchor': 'middle',
        fill: '#1e293b', 'font-size': 13, 'font-weight': 700
      });
      txt.textContent = label;
      svg.appendChild(txt);
    }

    container.appendChild(svg);
  }

  // ─── Mini Sparkline ───────────────────────────────────────────────────────
  function drawSparkline(containerId, values, color = '#1a7a5e') {
    const container = document.getElementById(containerId);
    if (!container || !values.length) return;
    container.innerHTML = '';

    const W = container.clientWidth || 120;
    const H = 36;
    const svg = svgEl('svg', { width: W, height: H });
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = W / (values.length - 1);

    const pts = values.map((v, i) => [i * step, H - 4 - ((v - min) / range) * (H - 8)]);

    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    pts.forEach(([x, y], i) => { if (i > 0) d += ` L ${x} ${y}`; });

    const line = svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round' });
    svg.appendChild(line);

    // last dot
    const [lx, ly] = pts[pts.length - 1];
    const dot = svgEl('circle', { cx: lx, cy: ly, r: 3, fill: color });
    svg.appendChild(dot);

    container.appendChild(svg);
  }

  // ─── Gauge / Progress Arc ─────────────────────────────────────────────────
  function drawGauge(containerId, percent, color = '#1a7a5e') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    const W = 100, H = 60;
    const cx = 50, cy = 55, r = 38;
    const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });

    const startAngle = Math.PI;
    const endAngle = startAngle + Math.PI;
    const fillAngle = startAngle + Math.min(percent / 100, 1) * Math.PI;

    const arc = (a1, a2, col, sw) => {
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = (a2 - a1) > Math.PI ? 1 : 0;
      return svgEl('path', {
        d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
        fill: 'none', stroke: col, 'stroke-width': sw,
        'stroke-linecap': 'round'
      });
    };

    svg.appendChild(arc(startAngle, endAngle, '#e8ecf0', 8));
    if (percent > 0) svg.appendChild(arc(startAngle, fillAngle, color, 8));

    const txt = svgEl('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', fill: color, 'font-size': 13, 'font-weight': 700 });
    txt.textContent = Math.round(percent) + '%';
    svg.appendChild(txt);

    container.appendChild(svg);
  }

  return { drawRevenueTrend, drawWinRateChart, drawProductChart, drawDonut, drawSparkline, drawGauge };
})();
