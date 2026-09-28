import type { Game } from './game';
const colors=['#aeea69','#f0957c'];
export function drawPitch(ctx:CanvasRenderingContext2D,g:Game,side:number|null,frame:number){
  ctx.clearRect(0,0,1000,600);
  ctx.fillStyle='#172a23';ctx.fillRect(0,0,1000,600);
  for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#1b382c':'#1d3d2e';ctx.fillRect(36+i*92.8,36,92.8,528);}
  const grad=ctx.createRadialGradient(500,260,40,500,300,610);grad.addColorStop(0,'rgba(106,167,105,.07)');grad.addColorStop(1,'rgba(0,0,0,.23)');ctx.fillStyle=grad;ctx.fillRect(0,0,1000,600);
  ctx.lineWidth=2;ctx.strokeStyle='rgba(185,220,182,.36)';ctx.strokeRect(36,36,928,528);
  ctx.beginPath();ctx.moveTo(500,36);ctx.lineTo(500,564);ctx.stroke();
  ctx.beginPath();ctx.arc(500,300,81,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#8cab86';ctx.beginPath();ctx.arc(500,300,3,0,Math.PI*2);ctx.fill();
  for(let i=0;i<2;i++){
    const left=i===0,x=left?36:804;ctx.strokeRect(x,163,160,274);ctx.strokeRect(left?36:906,226,58,148);
    ctx.beginPath();ctx.arc(left?150:850,300,3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(left?150:850,300,81,left?-.97:Math.PI-.97,left?.97:Math.PI+.97);ctx.stroke();
    ctx.fillStyle=left?'#aeea6911':'#f0957c11';ctx.fillRect(left?9:964,229,27,142);
    ctx.strokeStyle=left?'#aeea6980':'#f0957c80';ctx.lineWidth=2;ctx.strokeRect(left?9:964,229,27,142);
    ctx.strokeStyle='rgba(210,237,218,.15)';ctx.lineWidth=1;
    for(let y=239;y<371;y+=11){ctx.beginPath();ctx.moveTo(left?9:964,y);ctx.lineTo(left?36:991,y);ctx.stroke();}
    for(let z=0;z<3;z++){let gx=(left?9:964)+z*9;ctx.beginPath();ctx.moveTo(gx,229);ctx.lineTo(gx,371);ctx.stroke();}
    ctx.strokeStyle='rgba(185,220,182,.36)';ctx.lineWidth=2;
  }
  // Small ground markers make each team's direction unambiguous.
  ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.letterSpacing='3px';ctx.fillStyle='#b3cdb45c';ctx.fillText('FIRST TO THREE',500,585);ctx.letterSpacing='0px';
  g.keepers.forEach((k,i)=>{
    ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(k.x+2,k.y+7,21,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=i===0?'#4a876b':'#a4665a';ctx.beginPath();ctx.roundRect(k.x-12,k.y-17,24,34,7);ctx.fill();ctx.strokeStyle=colors[i];ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#f4eaca';ctx.beginPath();ctx.arc(k.x,k.y-1,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#eff5e5';ctx.fillRect(k.x-18,k.y-14,6,9);ctx.fillRect(k.x+12,k.y+5,6,9);
  });
  g.players.forEach((p,i)=>{
    const own=side===i;const color=colors[i];
    if(own){ctx.beginPath();ctx.arc(p.x,p.y,29,0,Math.PI*2);ctx.strokeStyle=color+'55';ctx.lineWidth=2;ctx.stroke();}
    if(g.ball.owner===i && g.phase==='playing'){
      ctx.strokeStyle=color+'85';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(p.x+p.fx*30,p.y+p.fy*30);ctx.lineTo(p.x+p.fx*78,p.y+p.fy*78);ctx.stroke();ctx.setLineDash([]);
    }
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(p.x+3,p.y+9,20,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,19,0,Math.PI*2);ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle=i===0?'#d9ffaf':'#ffc6b6';ctx.stroke();
    ctx.fillStyle='#17251e';ctx.font='800 15px system-ui';ctx.textAlign='center';ctx.fillText(i===0?'7':'10',p.x,p.y+5);
    ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(p.x+p.fx*27,p.y+p.fy*27);ctx.lineTo(p.x+p.fx*21-p.fy*5,p.y+p.fy*21+p.fx*5);ctx.lineTo(p.x+p.fx*21+p.fy*5,p.y+p.fy*21-p.fx*5);ctx.closePath();ctx.fill();
    ctx.font='600 12px system-ui';ctx.fillStyle=own?'#ecfbe5':'#c5cec5';ctx.fillText(own?'YOU':g.names[i]||'RIVAL',p.x,p.y-36);
    if(p.cooldown>0){ctx.strokeStyle=color+'99';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,25,-Math.PI/2,-Math.PI/2+(1-p.cooldown/.9)*Math.PI*2);ctx.stroke();}
  });
  const b=g.ball;
  if(Math.hypot(b.vx,b.vy)>100){ctx.strokeStyle='#f7f8d542';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.035,b.y-b.vy*.035);ctx.stroke();ctx.lineCap='butt';}
  ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(b.x+2,b.y+5,10,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f5f5e8';ctx.beginPath();ctx.arc(b.x,b.y,9,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#344339';ctx.save();ctx.translate(b.x,b.y);ctx.rotate(frame*.002);ctx.beginPath();for(let i=0;i<5;i++){let a=i*Math.PI*2/5;ctx.lineTo(Math.cos(a)*4,Math.sin(a)*4);}ctx.closePath();ctx.fill();ctx.restore();
}
