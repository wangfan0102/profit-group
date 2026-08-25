
const ChartUtil={
 draw(values){
  const c=document.getElementById('chart').getContext('2d');
  c.clearRect(0,0,700,180);
  if(values.length<2)return;
  const max=Math.max(...values),min=Math.min(...values),r=max-min||1;
  c.strokeStyle='#2563eb';c.lineWidth=3;c.beginPath();
  values.forEach((v,i)=>{const x=20+i*(660/(values.length-1));const y=160-(v-min)/r*120;i?c.lineTo(x,y):c.moveTo(x,y);});
  c.stroke();
 }
}
