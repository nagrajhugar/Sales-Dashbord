// ---------- Setup ----------
const REGIONS = [...new Set(SALES_DATA.map(r => r.region))].sort();
const CATEGORIES = [...new Set(SALES_DATA.map(r => r.category))].sort();

const state = {
  regions: new Set(REGIONS),
  categories: new Set(CATEGORIES),
  rangeDays: 30 // number or 'all'
};

const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('en-US');
const fmtInt = (n) => Math.round(n).toLocaleString('en-US');
const fmtPct = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';

const allDates = SALES_DATA.map(r => new Date(r.date));
const MAX_DATE = new Date(Math.max(...allDates));
const MIN_DATE = new Date(Math.min(...allDates));

function daysBetween(a, b) {
  return Math.round((a - b) / 86400000);
}

// ---------- Filter chip UI ----------
function renderChipGroup(containerId, items, selectedSet) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach(item => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selectedSet.has(item) ? ' active' : '');
    chip.textContent = item;
    chip.addEventListener('click', () => {
      if (selectedSet.has(item)) {
        if (selectedSet.size > 1) selectedSet.delete(item); // keep at least one selected
      } else {
        selectedSet.add(item);
      }
      renderChipGroup(containerId, items, selectedSet);
      update();
    });
    el.appendChild(chip);
  });
}

document.getElementById('resetFilters').addEventListener('click', () => {
  state.regions = new Set(REGIONS);
  state.categories = new Set(CATEGORIES);
  renderChipGroup('regionSelect', REGIONS, state.regions);
  renderChipGroup('categorySelect', CATEGORIES, state.categories);
  update();
});

document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const d = btn.dataset.days;
    state.rangeDays = d === 'all' ? 'all' : parseInt(d, 10);
    update();
  });
});

// ---------- Data filtering ----------
function getRangeBounds() {
  let start;
  if (state.rangeDays === 'all') {
    start = MIN_DATE;
  } else {
    start = new Date(MAX_DATE);
    start.setDate(start.getDate() - state.rangeDays + 1);
  }
  return { start, end: MAX_DATE };
}

function filterRows(rows, start, end) {
  return rows.filter(r => {
    const d = new Date(r.date);
    return d >= start && d <= end &&
      state.regions.has(r.region) &&
      state.categories.has(r.category);
  });
}

function totals(rows) {
  const revenue = rows.reduce((s, r) => s + r.revenue, 0);
  const orders = rows.reduce((s, r) => s + r.orders, 0);
  const aov = orders > 0 ? revenue / orders : 0;
  return { revenue, orders, aov };
}

function dailySeries(rows, start, end) {
  const map = new Map();
  const d = new Date(start);
  while (d <= end) {
    map.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    d.setDate(d.getDate() + 1);
  }
  rows.forEach(r => {
    const entry = map.get(r.date);
    if (entry) {
      entry.revenue += r.revenue;
      entry.orders += r.orders;
    }
  });
  return [...map.entries()].map(([date, v]) => ({
    date,
    revenue: v.revenue,
    orders: v.orders,
    aov: v.orders > 0 ? v.revenue / v.orders : 0
  }));
}

// ---------- Sparklines (plain SVG, no library) ----------
function drawSparkline(svgId, values) {
  const svg = document.getElementById(svgId);
  svg.innerHTML = '';
  if (values.length < 2) return;
  const w = 240, h = 48, pad = 4;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#4F46E5');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);

  // soft fill under the line
  const fillD = pathD + ` L${points[points.length - 1][0].toFixed(1)},${h} L${points[0][0].toFixed(1)},${h} Z`;
  const fill = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  fill.setAttribute('d', fillD);
  fill.setAttribute('fill', 'rgba(79, 70, 229, 0.08)');
  fill.setAttribute('stroke', 'none');
  svg.insertBefore(fill, path);
}

// ---------- Chart.js instances ----------
let trendChart, categoryChart, regionChart;
const chartFont = { family: 'Inter', size: 12 };

function initCharts() {
  const trendCtx = document.getElementById('trendChart');
  trendChart = new Chart(trendCtx, {
    type: 'line',
    data: { labels: [], datasets: [{
      label: 'Revenue',
      data: [],
      borderColor: '#4F46E5',
      backgroundColor: 'rgba(79, 70, 229, 0.08)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2
    }]},
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: (ctx) => fmtMoney(ctx.parsed.y) }
      }},
      scales: {
        x: { grid: { display: false }, ticks: { font: chartFont, maxTicksLimit: 8 } },
        y: { grid: { color: '#EEF0F4' }, ticks: { font: chartFont, callback: (v) => '$' + v/1000 + 'k' } }
      }
    }
  });

  const catCtx = document.getElementById('categoryChart');
  categoryChart = new Chart(catCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{
      label: 'Orders',
      data: [],
      backgroundColor: '#4F46E5',
      borderRadius: 6,
      maxBarThickness: 32
    }]},
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: chartFont } },
        y: { grid: { color: '#EEF0F4' }, ticks: { font: chartFont } }
      }
    }
  });

  const regCtx = document.getElementById('regionChart');
  regionChart = new Chart(regCtx, {
    type: 'doughnut',
    data: { labels: [], datasets: [{
      data: [],
      backgroundColor: ['#4F46E5', '#818CF8', '#34D399', '#FBBF24', '#F472B6', '#60A5FA'],
      borderWidth: 0
    }]},
    options: {
      responsive: true,
      cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { font: chartFont, boxWidth: 10, padding: 12 } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmtMoney(ctx.parsed)}` } }
      }
    }
  });
}

// ---------- Main update ----------
function update() {
  const { start, end } = getRangeBounds();
  const currentRows = filterRows(SALES_DATA, start, end);

  // previous equal-length period, for delta comparison
  const spanDays = daysBetween(end, start);
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - spanDays);
  const prevRows = filterRows(SALES_DATA, prevStart, prevEnd);

  const emptyState = document.getElementById('emptyState');
  emptyState.hidden = currentRows.length > 0;

  const cur = totals(currentRows);
  const prev = totals(prevRows);

  document.getElementById('revenueValue').textContent = fmtMoney(cur.revenue);
  document.getElementById('ordersValue').textContent = fmtInt(cur.orders);
  document.getElementById('aovValue').textContent = fmtMoney(cur.aov);

  setDelta('revenueDelta', cur.revenue, prev.revenue);
  setDelta('ordersDelta', cur.orders, prev.orders);
  setDelta('aovDelta', cur.aov, prev.aov);

  const series = dailySeries(currentRows, start, end);
  drawSparkline('revenueSpark', series.map(s => s.revenue));
  drawSparkline('ordersSpark', series.map(s => s.orders));
  drawSparkline('aovSpark', series.map(s => s.aov));

  // Trend chart labels: sparse date labels for readability
  const labels = series.map(s => {
    const d = new Date(s.date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  trendChart.data.labels = labels;
  trendChart.data.datasets[0].data = series.map(s => s.revenue);
  trendChart.update();

  document.getElementById('trendSub').textContent =
    `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Category breakdown (orders)
  const catTotals = {};
  const catRevenue = {};
  CATEGORIES.forEach(c => { catTotals[c] = 0; catRevenue[c] = 0; });
  currentRows.forEach(r => { catTotals[r.category] += r.orders; catRevenue[r.category] += r.revenue; });
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  categoryChart.data.labels = sortedCats.map(c => c[0]);
  categoryChart.data.datasets[0].data = sortedCats.map(c => c[1]);
  categoryChart.update();

  renderCategorySnapshot(catTotals, catRevenue);


  // Region breakdown (revenue)
  const regTotals = {};
  REGIONS.forEach(r => regTotals[r] = 0);
  currentRows.forEach(r => regTotals[r.region] += r.revenue);
  const sortedRegs = Object.entries(regTotals).sort((a, b) => b[1] - a[1]);
  regionChart.data.labels = sortedRegs.map(r => r[0]);
  regionChart.data.datasets[0].data = sortedRegs.map(r => Math.round(r[1]));
  regionChart.update();
}

function renderCategorySnapshot(catOrders, catRevenue) {
  const el = document.getElementById('categorySnapshot');
  el.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'cat-card' + (state.categories.has(cat) ? '' : ' dim');
    card.innerHTML = `
      <div class="cat-icon">${CATEGORY_ICONS[cat] || DEFAULT_ICON}</div>
      <div class="cat-name">${cat}</div>
      <div class="cat-stats">
        <span>${fmtInt(catOrders[cat] || 0)} orders</span>
        <strong>${fmtMoney(catRevenue[cat] || 0)}</strong>
      </div>
    `;
    card.addEventListener('click', () => {
      if (state.categories.has(cat)) {
        if (state.categories.size > 1) state.categories.delete(cat);
      } else {
        state.categories.add(cat);
      }
      renderChipGroup('categorySelect', CATEGORIES, state.categories);
      update();
    });
    el.appendChild(card);
  });
}

function setDelta(elId, curVal, prevVal) {
  const el = document.getElementById(elId);
  if (prevVal === 0) {
    el.textContent = curVal > 0 ? 'new' : '—';
    el.className = 'kpi-delta';
    return;
  }
  const pct = ((curVal - prevVal) / prevVal) * 100;
  el.textContent = fmtPct(pct) + ' vs prior';
  el.className = 'kpi-delta ' + (pct >= 0 ? 'up' : 'down');
}

// ---------- Init ----------
renderChipGroup('regionSelect', REGIONS, state.regions);
renderChipGroup('categorySelect', CATEGORIES, state.categories);
initCharts();
update();
