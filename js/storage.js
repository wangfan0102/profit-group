
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

  async load() {
    if (!this.remote) return this.localLoad();
    const { data, error } = await this.client
      .from('profit_records')
      .select('member_name, record_date, profit, remark')
      .order('record_date', { ascending: true });
    if (error) throw error;
    return data.map(row => ({
      name: row.member_name,
      date: row.record_date,
      profit: Number(row.profit),
      remark: row.remark || ''
    }));
  },

  async save(rows) {
    if (!this.remote) {
      this.localSave(rows);
      return;
    }
    const payload = rows.map(row => ({
      member_name: row.name,
      record_date: row.date,
      profit: row.profit,
      remark: row.remark || ''
    }));
    if (!payload.length) return;
    const { error } = await this.client.from('profit_records').upsert(payload, {
      onConflict: 'member_name,record_date'
    });
    if (error) throw error;
  },

  async upsert(row) {
    if (!this.remote) {
      const rows = this.localLoad();
      const index = rows.findIndex(item => item.name === row.name && item.date === row.date);
      index >= 0 ? rows[index] = row : rows.push(row);
      this.localSave(rows);
      return;
    }
    const { error } = await this.client.from('profit_records').upsert({
      member_name: row.name,
      record_date: row.date,
      profit: row.profit,
      remark: row.remark || ''
    }, { onConflict: 'member_name,record_date' });
    if (error) throw error;
  },

  localLoad() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },

  localSave(rows) { localStorage.setItem(this.KEY, JSON.stringify(rows)); }
};

Storage.init();
