# Sales Dashboard

A clean, single-page dashboard for tracking **Revenue**, **Orders**, and **Average Order Value (AOV)**, with filters by region and category.

![Sales Dashboard preview](screenshot.png)

## Run it in VS Code

1. Clone or copy this folder and open it in VS Code (`File > Open Folder`).
2. Install the **Live Server** extension (by Ritwick Dey) if you don't already have it.
3. Right-click `index.html` in the file explorer and choose **"Open with Live Server"**.
4. Your browser opens the dashboard, live-reloading whenever you edit a file.

No build step, no `npm install`, no internet connection needed — Chart.js is bundled locally in `vendor/`, so it also works by just double-clicking `index.html`.

## Run it after cloning from GitHub

```bash
git clone <your-repo-url>
cd sales-dashboard
# then open index.html directly, or serve it:
python3 -m http.server 8000
# visit http://localhost:8000
```

## Files

```
sales-dashboard/
├── index.html      # page structure
├── style.css       # all styling (design tokens as CSS variables at the top)
├── script.js       # filtering logic, KPI calculations, chart rendering
├── icons.js        # small hand-drawn SVG icons used on the category cards
├── data.js         # mock dataset (~3,500 rows) — swap for your real data
├── vendor/
│   └── chart.umd.min.js   # Chart.js, bundled locally (no CDN dependency)
└── screenshot.png  # preview image used above
```

## Using your own data

Replace the contents of `data.js` with your own array of records in this shape:

```js
const SALES_DATA = [
  { "date": "2026-01-15", "region": "North", "category": "Electronics", "orders": 5, "revenue": 940.50 },
  ...
];
```

Everything else (filters, KPIs, charts, category cards) recalculates automatically from whatever is in `SALES_DATA` — no other code changes needed as long as the field names match.

If your categories differ from the defaults (Electronics, Apparel, Home & Living, Beauty, Sports), add matching entries to the `CATEGORY_ICONS` map in `icons.js`; anything not listed falls back to a generic icon automatically.

## Features

- **KPI cards**: total Revenue, Orders, and AOV for the selected filters, each with a % change vs. the prior equal-length period and a trendline.
- **Filters**: region and category chips (click to toggle), plus date-range presets (30 / 90 / 365 days / All time).
- **Category snapshot cards**: an icon, order count, and revenue per category — also clickable as a shortcut filter.
- **Revenue trend** line chart over time.
- **Orders by category** bar chart.
- **Revenue by region** donut chart.
- Fully recalculates instantly on any filter change — no page reload, no server required.
