
const Calendar={
 render(rows,member='all'){
  const box=document.getElementById('calendar');box.innerHTML='';
  const now=new Date(),y=now.getFullYear(),m=now.getMonth(),days=new Date(y,m+1,0).getDate();
  const ym=`${y}-${String(m+1).padStart(2,'0')}`,sum={};
  rows.filter(r=>(member==='all'||r.name===member)&&r.date.startsWith(ym)).forEach(r=>sum[r.date]=(sum[r.date]||0)+r.profit);
  for(let i=1;i<=days;i++){
   const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
   const v=sum[ds]||0;const d=document.createElement('div');d.className='day';
   d.style.background=v>0?'#fee2e2':v<0?'#dcfce7':'#fff';
   d.innerHTML=`<b>${i}</b><br>${v?Math.round(v):''}`;box.appendChild(d);
  }
 }
}
