const CATEGORIES = ['식비', '교통', '사무용품', '소프트웨어', '출장', '기타'];
const STORAGE_KEY = 'expenses';

const $ = (id) => document.getElementById(id);
const won = (n) => '₩' + n.toLocaleString('ko-KR');

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

let expenses = load();

function visibleExpenses() {
  const month = $('month').value; // "YYYY-MM" or ""
  return expenses
    .filter((e) => !month || e.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function render() {
  const list = visibleExpenses();

  const tbody = $('expense-list');
  tbody.innerHTML = '';
  for (const e of list) {
    const tr = document.createElement('tr');
    for (const text of [e.date, e.description, e.category]) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    }
    const amount = document.createElement('td');
    amount.className = 'num';
    amount.textContent = won(e.amount);
    tr.appendChild(amount);

    const del = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = '삭제';
    btn.className = 'delete';
    btn.onclick = () => {
      expenses = expenses.filter((x) => x.id !== e.id);
      save();
      render();
    };
    del.appendChild(btn);
    tr.appendChild(del);
    tbody.appendChild(tr);
  }
  $('empty').hidden = list.length > 0;

  const summary = $('summary');
  summary.innerHTML = '';
  let total = 0;
  for (const cat of CATEGORIES) {
    const sum = list.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    total += sum;
    if (sum === 0) continue;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${cat}</td><td class="num">${won(sum)}</td>`;
    summary.appendChild(tr);
  }
  $('total').textContent = won(total);
}

function exportCsv() {
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['날짜', '내용', '분류', '금액'], ...visibleExpenses().map((e) => [e.date, e.description, e.category, e.amount])];
  const csv = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  // BOM so Excel reads Korean text correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `expenses${$('month').value ? '-' + $('month').value : ''}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
$('date').value = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
$('month').value = $('date').value.slice(0, 7);
$('category').innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join('');

$('expense-form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  expenses.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: $('date').value,
    description: $('description').value.trim(),
    category: $('category').value,
    amount: Math.round(Number($('amount').value)),
  });
  save();
  $('description').value = '';
  $('amount').value = '';
  $('description').focus();
  render();
});
$('month').addEventListener('change', render);
$('clear-month').addEventListener('click', () => {
  $('month').value = '';
  render();
});
$('export').addEventListener('click', exportCsv);

render();
