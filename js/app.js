const App = {
  mode: 'day',
  currentRows: [],

  members() { return window.PROFIT_GROUP_MEMBERS || ['郑', '叶', '凡', '悦', '廷', '凯', '法国赌神今晚打老虎', '高']; },

  localDate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  dateOffset(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return this.localDate(date);
  },

  async submit() {
    const name = document.getElementById('name').value;
    const date = document.getElementById('date').value;
    const profit = Number(document.getElementById('profit').value);
    const declaration = document.getElementById('remark').value.trim();
    if (!name || !date || Number.isNaN(profit)) return alert('请选择姓名，并输入日期和收益');
    try {
      await Storage.upsert({ name, date, profit, declaration });
      document.getElementById('profit').value = '';
      document.getElementById('remark').value = '';
      await this.render();
    } catch (error) { this.showError(error); }
  },

  rank(mode) { this.mode = mode; this.render(); },

  async history() {
    const name = document.getElementById('member').value;
    try {
      const rows = (await Storage.load()).filter(row => row.name === name).sort((a, b) => a.date.localeCompare(b.date));
      let sum = 0;
      const line = [];
      rows.forEach(row => { sum += row.profit; line.push(sum); });
      document.getElementById('summary').innerHTML = `累计收益：<b class="${sum >= 0 ? 'pos' : 'neg'}">${sum.toFixed(2)}</b>　共 ${rows.length} 天`;
      document.getElementById('historyBody').innerHTML = rows.slice().reverse().map(row => `<tr><td>${this.escape(row.date)}</td><td class="${row.profit >= 0 ? 'pos' : 'neg'}">${row.profit}</td><td>${this.escape(row.declaration || '')}</td></tr>`).join('');
      ChartUtil.draw(line);
    } catch (error) { this.showError(error); }
  },

  periodLabel() {
    if (this.mode === 'day') return `${this.localDate()} · 今日实时战况`;
    if (this.mode === 'week') return `${this.dateOffset(-6)} 至 ${this.localDate()}`;
    const now = new Date();
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
  },

  filterRows(rows) {
    if (this.mode === 'day') return rows.filter(row => row.date === this.localDate());
    if (this.mode === 'week') {
      const start = this.dateOffset(-6);
      const end = this.localDate();
      return rows.filter(row => row.date >= start && row.date <= end);
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return rows.filter(row => row.date.startsWith(month));
  },

  buildRank(rows, includeDeclarations = this.mode === 'day') {
    const map = {};
    rows.forEach(row => {
      map[row.name] ??= { profit: 0, days: 0, declaration: '' };
      map[row.name].profit += row.profit;
      map[row.name].days += 1;
      if (includeDeclarations && row.declaration) map[row.name].declaration = row.declaration;
    });
    return Object.entries(map).sort((a, b) => b[1].profit - a[1].profit || a[0].localeCompare(b[0], 'zh'));
  },

  renderPodium(rank) {
    const podium = document.getElementById('leaderboardPodium');
    podium.innerHTML = rank.slice(0, 3).map(([name, value], index) => `<div class="podium-item place-${index + 1}"><span class="podium-medal">${['🥇', '🥈', '🥉'][index]}</span><strong>${this.escape(name)}</strong><b class="${value.profit >= 0 ? 'pos' : 'neg'}">${value.profit.toFixed(2)}</b><small>${value.days} 天</small></div>`).join('');
  },

  renderChampion(rank) {
    const notice = document.getElementById('championNotice');
    const champion = rank[0];
    if (!champion) { notice.hidden = true; notice.innerHTML = ''; return; }
    const [name, value] = champion;
    notice.hidden = false;
    notice.innerHTML = `<span class="champion-crown">👑</span><span>今日冠军 <b>${this.escape(name)}</b>：${this.escape(value.declaration || '今天也要稳稳拿下！')}</span>`;
  },

  renderCalendarOptions() {
    const select = document.getElementById('calendarMember');
    const selected = select.value || 'all';
    select.innerHTML = '<option value="all">群里总收益</option>' + this.members().map(name => `<option value="${this.escape(name)}">${this.escape(name)}</option>`).join('');
    select.value = ['all', ...this.members()].includes(selected) ? selected : 'all';
    document.getElementById('calendarScope').textContent = select.value === 'all' ? '显示全群每日收益合计' : `显示 ${select.value} 的每日收益`;
    Calendar.render(this.currentRows, select.value);
  },

  calendarFilter() { this.renderCalendarOptions(); },

  async render() {
    const dateInput = document.getElementById('date');
    if (!dateInput.value) dateInput.value = this.localDate();
    const nameSelect = document.getElementById('name');
    if (!nameSelect.options.length) nameSelect.innerHTML = '<option value="">选择姓名</option>' + this.members().map(name => `<option value="${this.escape(name)}">${this.escape(name)}</option>`).join('');
    let all;
    try { all = await Storage.load(); } catch (error) { this.showError(error); return; }
    this.currentRows = all;
    this.renderCalendarOptions();
    const todayRows = all.filter(row => row.date === this.localDate());
    document.getElementById('today').innerHTML = `今日群收益：<b>${todayRows.reduce((sum, row) => sum + row.profit, 0).toFixed(2)}</b>　打卡 ${todayRows.length} 人`;
    const rank = this.buildRank(this.filterRows(all));
    const todayRank = this.buildRank(all.filter(row => row.date === this.localDate()), true);
    document.getElementById('rankPeriod').textContent = this.periodLabel();
    document.querySelectorAll('[data-rank-mode]').forEach(button => button.classList.toggle('active', button.dataset.rankMode === this.mode));
    this.renderChampion(todayRank);
    this.renderPodium(rank);
    const showDays = this.mode !== 'day';
    const showDeclaration = this.mode === 'day';
    document.getElementById('rankDaysHead').hidden = !showDays;
    document.getElementById('rankDeclarationHead').hidden = !showDeclaration;
    document.getElementById('rankBody').innerHTML = rank.map(([name, value], index) => `<tr><td><span class="rank-number">${index + 1}</span></td><td><strong>${this.escape(name)}</strong></td><td class="${value.profit >= 0 ? 'pos' : 'neg'}">${value.profit.toFixed(2)}</td><td${showDays ? '' : ' hidden'}>${value.days}</td><td class="declaration-cell"${showDeclaration ? '' : ' hidden'}>${this.escape(value.declaration || '—')}</td></tr>`).join('');
    const memberSelect = document.getElementById('member');
    const selected = memberSelect.value;
    memberSelect.innerHTML = '<option value="">选择成员</option>' + this.members().map(name => `<option value="${this.escape(name)}">${this.escape(name)}</option>`).join('');
    if (this.members().includes(selected)) memberSelect.value = selected;
    this.setStatus();
  },

  async export() {
    const blob = new Blob([JSON.stringify(await Storage.load(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'profit-data.json'; link.click(); URL.revokeObjectURL(link.href);
  },

  import(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => { try { const rows = JSON.parse(reader.result); if (!Array.isArray(rows)) throw new Error('JSON 必须是数组'); await Storage.save(rows); await this.render(); } catch (error) { this.showError(error); } };
    reader.readAsText(file);
  },

  setStatus() {
    const status = document.getElementById('connectionStatus');
    status.textContent = Storage.remote ? '已连接 Supabase' : '当前使用浏览器本地存储';
    status.className = `connection-status ${Storage.remote ? 'connected' : 'local'}`;
  },

  showError(error) { console.error(error); const status = document.getElementById('connectionStatus'); status.textContent = `Supabase 操作失败：${error.message || error}`; status.className = 'connection-status error'; },
  escape(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
};

App.render();
