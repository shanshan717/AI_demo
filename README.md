# Daily Flow

A lightweight personal productivity PWA for daily task tracking and smart expense logging — no server, no sign-up, just open and use.

---

## Features

### Dashboard
An at-a-glance overview showing four live metrics:
- **Today's Todos** — number of tasks planned for today
- **Completion Rate** — percentage of today's tasks marked done
- **Last 7 Days Spending** — rolling weekly expense total
- **This Month's Spending** — current month expense total

### Daily Todo
- Pick any date and add plain-text tasks
- Check off tasks as you finish them
- Delete tasks you no longer need
- Completion rate updates the dashboard in real time

### Smart Expense Entry
Type expenses in natural language — no rigid forms needed:
> *"Lunch ¥18, cab ride ¥25, bought a book ¥60"*

The app splits the input by punctuation/newlines, extracts amounts, and **auto-categorizes** each entry using keyword matching:

| Category | Example keywords |
|----------|-----------------|
| 餐饮 (Food & Drink) | 吃、饭、餐、奶茶、外卖 |
| 服饰 (Clothing) | 衣、裤、鞋、包 |
| 交通 (Transport) | 打车、地铁、公交、加油 |
| 居家 (Home) | 房租、水费、电费、日用品 |
| 娱乐 (Entertainment) | 电影、游戏、旅游 |
| 学习 (Education) | 书、课程、培训、订阅 |
| 医疗 (Healthcare) | 药、医院、挂号 |
| 其他 (Other) | anything unmatched |

### Statistics & Analysis
Toggle between **weekly** and **monthly** views to see a spending breakdown by category and a total summary.

---

## Tech Stack

| Layer | Detail |
|-------|--------|
| UI | Vanilla HTML / CSS / JavaScript (no framework) |
| Storage | `localStorage` — fully offline, zero backend |
| PWA | `manifest.json` + Service Worker (`sw.js`) for installability and offline caching |
| Design | Responsive sidebar layout, soft pastel palette, CSS custom properties |

---

## Getting Started

No build step required. Just serve the files with any static HTTP server:

```bash
# Python 3
python -m http.server 8080

# or Node.js (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser. You can also **install it as a PWA** from the browser's address bar on supported platforms.

---

## Data & Privacy

All data is stored exclusively in your browser's `localStorage`. Nothing is ever sent to a server. Clearing browser data will erase all records.

---

## Project Structure

```
├── index.html      # App shell and markup
├── styles.css      # All styling (CSS variables, responsive layout)
├── app.js          # Application logic (todos, expense parsing, rendering)
├── sw.js           # Service Worker (cache-first offline strategy)
├── manifest.json   # PWA manifest (name, theme, display mode)
└── README.md
```

