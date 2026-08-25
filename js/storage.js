
const Storage = {
  KEY: 'profit-group-db',
  client: null,
  remote: false,

  init() {
    const config = window.PROFIT_GROUP_SUPABASE || {};
    if (config.url && config.anonKey && window.supabase?.createClient) {
      this.client = window.supabase.createClient(config.url, config.anonKey);
      this.remote = true;
    }
    return this.remote;
  },

  normalizeName(name) {
    const value = String(name || '').trim();
    const aliases = window.PROFIT_GROUP_ALIASES || {};
    return aliases[value] || value;
  },

  normalizeRows(rows) {
    const merged = new Map();
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const name = this.normalizeName(row.name ?? row.member_name);
      const date = String(row.date ?? row.record_date ?? '').slice(0, 10);
      if (!name || !date) return;
      const item = {
        name,
        date,
        profit: Number(row.profit) || 0,
        declaration: String(row.declaration ?? row.remark ?? '').trim()
      };
      // Aliases can collapse into the same member/date; the last saved row wins.
      merged.set(`${name}|${date}`, item);
    });
    return [...merged.values()];
  },

  async load() {
    if (!this.remote) return this.localLoad();
    const { data, error } = await this.client
      .from('profit_records')
      .select('member_name, record_date, profit, remark')
      .order('record_date', { ascending: true });
    if (error) throw error;
    return this.normalizeRows(data);
  },

  async save(rows) {
    if (!this.remote) {
      this.localSave(this.normalizeRows(rows));
      return;
    }
    const payload = this.normalizeRows(rows).map(row => ({
      member_name: row.name,
      record_date: row.date,
      profit: row.profit,
      remark: row.declaration || ''
    }));
    if (!payload.length) return;
    const { error } = await this.client.from('profit_records').upsert(payload, {
      onConflict: 'member_name,record_date'
    });
    if (error) throw error;
  },

  async upsert(row) {
    if (!this.remote) {
      const rows = this.normalizeRows(this.localLoad());
      const next = this.normalizeRows([...rows, row]);
      this.localSave(next);
      return;
    }
    const { error } = await this.client.from('profit_records').upsert({
      member_name: this.normalizeName(row.name),
      record_date: row.date,
      profit: row.profit,
      remark: row.declaration || row.remark || ''
    }, { onConflict: 'member_name,record_date' });
    if (error) throw error;
  },

  localLoad() {
    try { return this.normalizeRows(JSON.parse(localStorage.getItem(this.KEY) || '[]')); }
    catch { return []; }
  },

  localSave(rows) { localStorage.setItem(this.KEY, JSON.stringify(rows)); }
};

Storage.init();
