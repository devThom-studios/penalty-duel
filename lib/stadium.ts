import * as THREE from 'three';
import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
import {type DuelView,striker} from './penalty';
import {matchKits,type Kit} from './teams';
export type SceneState={game:DuelView|null;now:number;zone:number;side:number};
export type TargetPosition={x:number;y:number;size:number};
const ZONES=[[-2.5,1.92],[0,1.92],[2.5,1.92],[-2.5,.48],[0,.48],[2.5,.48]];
export function createStadium(canvas:HTMLCanvasElement,getState:()=>SceneState,onTargets:(p:TargetPosition[])=>void){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#091625');scene.fog=new THREE.Fog('#091625',28,78);
 let renderer:THREE.WebGLRenderer|SVGRenderer;let gl:THREE.WebGLRenderer|null=null;
 try{gl=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer=gl;gl.setPixelRatio(Math.min(devicePixelRatio,1.7));gl.shadowMap.enabled=true;gl.shadowMap.type=THREE.PCFSoftShadowMap;gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.2;}
 catch{const svg=new SVGRenderer();svg.setPrecision(2);renderer=svg;canvas.style.visibility='hidden';Object.assign(svg.domElement.style,{position:'absolute',inset:'0',width:'100%',height:'100%'});canvas.parentElement?.appendChild(svg.domElement);}
 const software=!gl;if(software)renderer.domElement.style.backgroundImage='linear-gradient(#091625 0%,#091625 43%,#236648 43%,#31825b 100%)';
 const camera=new THREE.PerspectiveCamera(38,1,.1,120);camera.position.set(0,3.65,16.8);camera.lookAt(0,1.05,1.4);
 const ambient=new THREE.HemisphereLight('#c0dfff','#18342c',2.2);scene.add(ambient);
 const key=new THREE.DirectionalLight('#e4f1ff',3.6);key.position.set(-9,16,12);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-14,right:14,top:18,bottom:-8,near:.5,far:60});key.shadow.bias=-.0005;scene.add(key);
 const fill=new THREE.DirectionalLight('#71b4ff',1.5);fill.position.set(12,8,-4);scene.add(fill);if(software){ambient.intensity=.7;key.intensity=1.0;fill.intensity=.45;}
 const mat=(color:string,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
 const grass=mat('#267350'),grass2=mat('#2c815a'),white=mat('#e5f3ed'),blue=mat('#4a8dff'),keeperMat=mat('#fdbf4a'),skin=mat('#b97d53'),boot=mat('#111827'),dark=mat('#172436');
 function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material,parent:THREE.Object3D=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function sphere(r:number,x:number,y:number,z:number,m:THREE.Material,parent:THREE.Object3D=scene){const o=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
 function tube(a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material,parent:THREE.Object3D=scene){const dir=new THREE.Vector3().subVectors(b,a);const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),10),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());o.castShadow=true;parent.add(o);return o;}
 if(!software){box(80,.12,90,0,-.09,18,grass);
 for(let z=-10;z<44;z+=4)box(47,.012,2,0,-.017,z,grass2);}
 function groundLine(x1:number,z1:number,x2:number,z2:number){const p=[new THREE.Vector3(x1,.006,z1),new THREE.Vector3(x2,.006,z2)];scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:'#d1e9d6',transparent:true,opacity:.78})));}
 groundLine(-21,0,21,0);groundLine(-9.16,0,-9.16,16.5);groundLine(9.16,0,9.16,16.5);groundLine(-9.16,16.5,9.16,16.5);groundLine(-5.5,0,-5.5,5.5);groundLine(5.5,0,5.5,5.5);groundLine(-5.5,5.5,5.5,5.5);
 const spot=new THREE.Mesh(new THREE.CircleGeometry(.105,24),white);spot.rotation.x=-Math.PI/2;spot.position.set(0,.01,9.5);scene.add(spot);
 const goal=new THREE.Group();scene.add(goal);
 tube(new THREE.Vector3(-3.66,0,0),new THREE.Vector3(-3.66,2.44,0),.065,white,goal);tube(new THREE.Vector3(3.66,0,0),new THREE.Vector3(3.66,2.44,0),.065,white,goal);tube(new THREE.Vector3(-3.66,2.44,0),new THREE.Vector3(3.66,2.44,0),.065,white,goal);
 for(const x of [-3.66,3.66]){tube(new THREE.Vector3(x,2.44,0),new THREE.Vector3(x,2.44,-1.7),.025,white,goal);tube(new THREE.Vector3(x,0,-1.7),new THREE.Vector3(x,2.44,-1.7),.028,white,goal);}
 const netPoints:number[]=[];const line=(a:number[],b:number[])=>netPoints.push(...a,...b);
 for(let x=-3.66;x<=3.7;x+=.244){line([x,0,-1.7],[x,2.44,-1.7]);line([x,2.44,0],[x,2.44,-1.7]);}
 for(let y=0;y<=2.45;y+=.203){line([-3.66,y,-1.7],[3.66,y,-1.7]);for(const x of [-3.66,3.66])line([x,y,0],[x,y,-1.7]);}
 for(let z=-1.7;z<=.01;z+=.243){line([-3.66,2.44,z],[3.66,2.44,z]);for(const x of [-3.66,3.66])line([x,0,z],[x,2.44,z]);}
 const ng=new THREE.BufferGeometry();ng.setAttribute('position',new THREE.Float32BufferAttribute(netPoints,3));const net=new THREE.LineSegments(ng,new THREE.LineBasicMaterial({color:'#c4dfec',transparent:true,opacity:.35}));goal.add(net);
 const stands=new THREE.Group();scene.add(stands);
 for(let i=0;i<7;i++)box(55,.55,1.3,0,.4+i*.65,-5-i*1.35,i%2?mat('#1e334e'):mat('#233d5b'),stands);
 // Seats are instanced so the stadium remains light on phones.
 const crowd=new THREE.InstancedMesh(new THREE.BoxGeometry(.24,.35,.25),mat('#52677e'),1000);const dummy=new THREE.Object3D();const crowdColors=['#508bd2','#72b9d8','#d8b994','#809aae','#a2c8c8','#4c607f'];
 for(let i=0;i<1000;i++){const row=Math.floor(i/143),col=i%143;dummy.position.set(-24+col*.34,.85+row*.65,-5.0-row*1.35);dummy.rotation.y=(i%5)*.08;dummy.updateMatrix();crowd.setMatrixAt(i,dummy.matrix);crowd.setColorAt(i,new THREE.Color(crowdColors[i%6]));}if(!software)stands.add(crowd);else for(let j=0;j<210;j++){const row=Math.floor(j/30),col=j%30;box(.25,.37,.28,-15+col,1+row*.65,-5-row*1.35,mat(crowdColors[j%6]),stands);}
 const adMat=new THREE.MeshBasicMaterial({color:'#274d87'});box(45,.8,.15,0,.42,-3.7,adMat);
 for(let x=-21;x<23;x+=7){box(3.2,.045,.02,x,.56,-3.60,new THREE.MeshBasicMaterial({color:'#81bdff'}));box(1.8,.045,.02,x,.31,-3.60,new THREE.MeshBasicMaterial({color:'#aac7e5'}));}
 for(const x of [-17,17]){tube(new THREE.Vector3(x,0,-7),new THREE.Vector3(x,12,-7),.11,dark);box(4,.8,.25,x,12,-7,white);for(let j=0;j<7;j++)box(.37,.48,.1,x-1.5+j*.5,12,-6.8,new THREE.MeshBasicMaterial({color:'#d7eeff'}));}
 function person(initial:Kit,goalkeeper=false){
  const material=mat(initial.shirt),shorts=mat(initial.shorts),socks=mat(initial.socks),trim=mat(initial.trim);
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);scene.add(root);
  const torso=box(.56,.65,.3,0,1.22,0,material,body);torso.rotation.z=.01;
  for(const z of [-.155,.155]){box(.14,.57,.012,0,1.22,z,trim,body);box(.18,.035,.014,0,1.53,z,trim,body);}
  sphere(.205,0,1.84,0,skin,body);sphere(.207,0,1.92,-.035,boot,body);
  box(.55,.22,.31,0,.79,0,shorts,body);
  const limbs=[] as THREE.Group[];
  for(const x of [-.17,.17]){const leg=new THREE.Group();leg.position.set(x,.76,0);body.add(leg);box(.18,.52,.18,0,-.24,0,skin,leg);box(.2,.23,.2,0,-.49,0,socks,leg);box(.22,.15,.38,0,-.64,.07,boot,leg);limbs.push(leg);}
  for(const x of [-.38,.38]){const arm=new THREE.Group();arm.position.set(x,1.5,0);body.add(arm);box(.18,.3,.2,0,-.1,0,material,arm);box(.14,.34,.14,0,-.38,0,skin,arm);sphere(goalkeeper?.13:.09,0,-.57,0,goalkeeper?white:skin,arm);arm.rotation.z=x<0?-.18:.18;limbs.push(arm);}
  return {root,body,limbs,material,applyKit:(k:Kit)=>{material.color.set(k.shirt);shorts.color.set(k.shorts);socks.color.set(k.socks);trim.color.set(k.trim);}};
 }
 const initialKits=matchKits([null,null]);
 const keeper=person(initialKits[1].keeper,true);keeper.root.position.set(0,.02,.15);
 const player=person(initialKits[0]);player.root.position.set(-.6,.02,10.75);player.root.rotation.y=Math.PI;
 const ballGeometry=new THREE.IcosahedronGeometry(.16,1);const ball=new THREE.Mesh(ballGeometry,white);ball.castShadow=true;scene.add(ball);
 const patches=new THREE.Group();ball.add(patches);for(let i=0;i<12;i++){const phi=Math.acos(-1+2*i/11),theta=Math.sqrt(12*Math.PI)*phi;const p=new THREE.Vector3(.159*Math.cos(theta)*Math.sin(phi),.159*Math.sin(theta)*Math.sin(phi),.159*Math.cos(phi));const disc=new THREE.Mesh(new THREE.CircleGeometry(.053,5),boot);disc.position.copy(p);disc.lookAt(p.clone().multiplyScalar(2));patches.add(disc);}
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.21,24),new THREE.MeshBasicMaterial({color:'#0e3021',transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
 const ballRing=new THREE.Mesh(new THREE.RingGeometry(.34,.365,40),new THREE.MeshBasicMaterial({color:'#8be9ff',transparent:true,opacity:.6,side:THREE.DoubleSide}));ballRing.rotation.x=-Math.PI/2;ballRing.position.set(0,.012,9.5);scene.add(ballRing);
 let width=0,height=0,raf=0,lastFrame=0,kitKey='';
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h||w===width&&h===height)return;width=w;height=h;if(gl)gl.setSize(w,h,false);else renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w/h<1?44:38;camera.updateProjectionMatrix();camera.updateMatrixWorld();const projected=ZONES.map(([x,y])=>{const p=new THREE.Vector3(x,y,.05).project(camera);return {x:(p.x+1)*50,y:(1-p.y)*50,size:Math.min(66,Math.max(34,w/(w/h<1?8:12)))};});const gap=Math.abs(projected[3].y-projected[0].y)*h/100;onTargets(projected.map(p=>({...p,size:Math.max(28,Math.min(60,gap*.82))}))); }
 function animate(t:number){
  if(software&&t-lastFrame<32){raf=requestAnimationFrame(animate);return;}lastFrame=t;
  resize();const {game:g,now}=getState();const isReveal=g?.phase==='reveal'||g?.phase==='finished';const elapsed=g?.last&&isReveal?Math.max(0,(now-g.revealAt)/1000):-1;
  const k=g?.last;const flying=elapsed>=.5;const flight=Math.min(1,Math.max(0,(elapsed-.5)/.92));
  keeper.root.position.set(Math.sin(t*.0018)*.08,.02,.15);keeper.body.rotation.set(0,0,0);keeper.limbs[2].rotation.z=-.22;keeper.limbs[3].rotation.z=.22;keeper.limbs[0].rotation.x=0;keeper.limbs[1].rotation.x=0;
  player.root.position.set(-.6,.02,10.75);player.body.rotation.x=0;player.limbs[0].rotation.x=0;player.limbs[1].rotation.x=0;ball.position.set(0,.16,9.5);ball.rotation.set(0,0,0);net.scale.z=1;ballRing.visible=!isReveal;
  const kicker=g?striker(g):0,nextKitKey=JSON.stringify([g?.teams??[null,null],kicker]);
  if(kitKey!==nextKitKey){kitKey=nextKitKey;const kits=matchKits(g?.teams??[null,null]);player.applyKit(kits[kicker]);keeper.applyKit(kits[1-kicker].keeper);}
  if(isReveal&&k){
   const run=Math.min(1,elapsed/.5);player.root.position.z=10.75-run*.72;player.root.position.x=-.6+run*.28;player.body.rotation.x=run*.10;player.limbs[0].rotation.x=-Math.sin(run*Math.PI)*.75;player.limbs[1].rotation.x=Math.sin(Math.min(1,(elapsed-.25)/.32)*Math.PI)*1.15;
   const dive=Math.min(1,Math.max(0,(elapsed-.63)/.7)),ease=1-Math.pow(1-dive,3);const [kx,ky]=ZONES[k.outcome==='saved'?k.zone:k.keeperZone];
   keeper.root.position.x=kx*.91*ease;keeper.root.position.y=.02+Math.sin(dive*Math.PI)*(ky>1?.75:.22);
   keeper.body.rotation.z=-Math.sign(kx)*ease*1.12;keeper.limbs[2].rotation.z=-.22-ease*1.4;keeper.limbs[3].rotation.z=.22+ease*1.4;
   keeper.limbs[0].rotation.x=-ease*.35;keeper.limbs[1].rotation.x=ease*.45;
   if(flying){
    const [tx,zy]=ZONES[k.zone];const ty=k.outcome==='miss'?3.25:zy;
    ball.position.set(tx*flight,.16+(ty-.16)*flight+Math.sin(flight*Math.PI)*.65,9.5*(1-flight));
    if(flight>=1){const after=Math.min(1,(elapsed-1.42)/.8);
     if(k.outcome==='goal'){ball.position.z=-Math.min(1.4,after*3);ball.position.y=Math.max(.16,ty*(1-after));net.scale.z=1+Math.sin(after*20)*.04*(1-after);}
     else if(k.outcome==='saved'){ball.position.z=after*4;ball.position.x+=after*(tx<0?-1.5:1.5);ball.position.y=Math.max(.16,ty*(1-after));}
     else{ball.position.z=-after*7;ball.position.y=3.25-after*2;}
    }
    ball.rotation.set(flight*11,flight*8,flight*4);
   }
  }
  shadow.position.set(ball.position.x,.015,ball.position.z);shadow.scale.setScalar(Math.max(.5,1-ball.position.y*.1));
  renderer.render(scene,camera);raf=requestAnimationFrame(animate);
 }
 raf=requestAnimationFrame(animate);
 return ()=>{cancelAnimationFrame(raf);if(gl)gl.dispose();else renderer.domElement.remove();canvas.style.visibility='';scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});};
}
