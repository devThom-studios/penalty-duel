'use client';
import {useEffect,useRef,useState} from 'react';
import type {DuelView} from '@/lib/penalty';
import type {TargetPosition,SceneState} from '@/lib/stadium';
export const zoneNames=['Top left','Top centre','Top right','Bottom left','Bottom centre','Bottom right'];
export default function PenaltyScene({game,now,side,zone,onZone,canChoose}:{game:DuelView|null;now:number;side:number;zone:number;onZone:(v:number)=>void;canChoose:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);const state=useRef<SceneState>({game,now,side,zone});state.current={game,now,side,zone};
 const [targets,setTargets]=useState<TargetPosition[]>([]),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let stop:(()=>void)|undefined,cancelled=false;
  import('@/lib/stadium').then(({createStadium})=>{if(cancelled||!canvas.current)return;try{stop=createStadium(canvas.current,()=>state.current,setTargets);setLoaded(true);}catch{setFailed(true);setLoaded(true);}}).catch(()=>{setFailed(true);setLoaded(true);});
  return()=>{cancelled=true;stop?.();};
 },[]);
 return <div className="stadium"><canvas ref={canvas} aria-label="Three-dimensional penalty pitch with a striker, football and goalkeeper"/>
  {!loaded&&<span className="stadium-loading" role="status">OPENING THE STADIUM…</span>}
  {failed&&<div className="graphics-fallback"><p>Choose your target below.</p><span>Your browser could not display the 3D stadium.</span></div>}
  {canChoose&&<div className={'target-layer '+(failed?'fallback-targets':'')} aria-label="Goal target zones">{zoneNames.map((name,i)=><button key={name} className={'goal-target '+(zone===i?'selected':'')} style={failed?{}:{left:`${targets[i]?.x??50}%`,top:`${targets[i]?.y??40}%`,width:targets[i]?.size??40,height:targets[i]?.size??40,visibility:targets.length?'visible':'hidden'}} aria-label={name} aria-pressed={zone===i} onClick={()=>onZone(i)}><span>{i+1}</span></button>)}</div>}
 </div>;
}
