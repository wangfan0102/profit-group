
const App={
 mode:'total',
 async submit(){
  const nameValue=document.getElementById('name').value.trim();
  const dateValue=document.getElementById('date').value;
  const profitValue=Number(document.getElementById('profit').value);
  const remarkValue=document.getElementById('remark').value.trim();
  if(!nameValue||!dateValue||Number.isNaN(profitValue)) return alert('请输入姓名、日期和收益');
  try {
   await Storage.upsert({name:nameValue,date:dateValue,profit:profitValue,remark:remarkValue});
   document.getElementById('remark').value='';
   await this.render();
  } catch (error) { this.showError(error); }
 },
 rank(mode){this.mode=mode;this.render();},
 async history(){
  const nameValue=document.getElementById('member').value;
  try {
   const rows=(await Storage.load()).filter(r=>r.name===nameValue).sort((a,b)=>a.date.localeCompare(b.date));
   let sum=0,line=[];rows.forEach(r=>{sum+=r.profit;line.push(sum)});
   document.getElementById('summary').innerHTML=`累计收益：<b class="${sum>=0?'pos':'neg'}">${sum.toFixed(2)}</b>　共 ${rows.length} 天`;
   document.getElementById('historyBody').innerHTML=rows.slice().reverse().map(r=>`<tr><td>${this.escape(r.date)}</td><td class="${r.profit>=0?'pos':'neg'}">${r.profit}</td><td>${this.escape(r.remark||'')}</td></tr>`).join('');
   ChartUtil.draw(line);
  } catch (error) { this.showError(error); }
 },
 async render(){
  const dateInput=document.getElementById('date');
  if(!dateInput.value) dateInput.value=new Date().toISOString().slice(0,10);
  let all;
  try { all=await Storage.load(); }
  catch (error) { this.showError(error); return; }
  Calendar.render(all);
  const todayStr=new Date().toISOString().slice(0,10);
  const todayRows=all.filter(r=>r.date===todayStr);
  document.getElementById('today').innerHTML=`今日群收益：<b>${todayRows.reduce((a,b)=>a+b.profit,0).toFixed(2)}</b>　打卡 ${todayRows.length} 人`;
  let rows=[...all],now=new Date();
  if(this.mode==='month'){const ym=now.toISOString().slice(0,7);rows=rows.filter(r=>r.date.startsWith(ym))}
  if(this.mode==='week'){const s=new Date(now);s.setDate(now.getDate()-6);rows=rows.filter(r=>new Date(r.date)>=s)}
  const map={};rows.forEach(r=>{map[r.name]??={p:0,d:0};map[r.name].p+=r.profit;map[r.name].d++});
  const rank=Object.entries(map).sort((a,b)=>b[1].p-a[1].p);
  document.getElementById('rankBody').innerHTML=rank.map(([n,v],i)=>`<tr><td>${i+1}</td><td>${this.escape(n)}</td><td class="${v.p>=0?'pos':'neg'}">${v.p.toFixed(2)}</td><td>${v.d}</td></tr>`).join('');
  const memberSelect=document.getElementById('member');
  const selected=memberSelect.value;
  memberSelect.innerHTML='<option value="">选择成员</option>'+rank.map(([n])=>`<option value="${this.escape(n)}">${this.escape(n)}</option>`).join('');
  if(rank.some(([n])=>n===selected)) memberSelect.value=selected;
  this.setStatus();
 },
 async export(){const blob=new Blob([JSON.stringify(await Storage.load(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='profit-data.json';a.click();URL.revokeObjectURL(a.href);},
 import(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const rows=JSON.parse(r.result);if(!Array.isArray(rows))throw new Error('JSON 必须是数组');await Storage.save(rows);await this.render();}catch(error){this.showError(error)}};r.readAsText(f);},
 setStatus(){
  const status=document.getElementById('connectionStatus');
  status.textContent=Storage.remote?'已连接 Supabase':'当前使用浏览器本地存储（填写 js/supabase-config.js 后连接 Supabase）';
  status.className=`connection-status ${Storage.remote?'connected':'local'}`;
 },
 showError(error){console.error(error);const status=document.getElementById('connectionStatus');status.textContent=`Supabase 操作失败：${error.message||error}`;status.className='connection-status error';},
 escape(value){return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
}
App.render();
