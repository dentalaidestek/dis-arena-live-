import {randomUUID} from 'node:crypto';
import {ranked,isLocked,type Procedure} from '../src/coinArena';
import {ArenaStore,type Receipt} from './store';
const names=['Ahmet','Zeynep','Mehmet','Elif','Veli','Ali','Hasan','Cem','Deniz','Eren','Mert','Aslı','Ece','Kerem','Buse','Selin','Emre','Derya','Ayşe','Can','Ozan','İrem','Berk','Seda','Mina','Efe','Yusuf','Ada'];
const gifts=[{giftId:'demo-rose',name:'Demo Gül',coins:1,streak:true},{giftId:'demo-extract',name:'Demo Çekim',coins:20,streak:false},{giftId:'demo-implant',name:'Demo İmplant',coins:20,streak:false},{giftId:'demo-decay',name:'Demo Çürütme',coins:10,streak:false},{giftId:'demo-heal',name:'Demo İyileştirme',coins:10,streak:false}];
export function runDemo(store:ArenaStore,body:{action:string;userId?:string;autoTarget?:boolean},now=Date.now()):Receipt|undefined {
 if(!['populate','extract','implant','decay','heal','rose1000','burst','finish'].includes(body.action))throw Error('Geçersiz demo işlemi');
 store.setCatalog(gifts,'demo-only',now);for(const proc of ['extract','implant','decay','heal'] as Procedure[])store.mapGift('demo-'+proc,proc);
 if(body.action==='finish'){const s=store.state();if(s.startedAt)store.tick(s.startedAt+600000);return;}
 if(body.action==='populate')store.newRound(now);
 let userId=body.userId??'demo-1';
 if(body.autoTarget){
  const players=ranked(store.state());
  if(!players.length||store.state().finishedAt)throw Error('Önce 28 oyunculu demo başlatın');
  if(body.action==='implant'||body.action==='heal'){
   const condition=body.action==='implant'?'extracted':'decayed';const target=players.find(p=>isLocked(p,now)&&p.condition===condition);
   if(!target)throw Error(body.action==='implant'?'Önce çekim yapın; ardından implantı deneyin':'Önce çürütme yapın; ardından iyileştirmeyi deneyin');
   userId=target.userId;
  }else userId=players.find((p,i)=>i>0&&!isLocked(p,now)&&!isLocked(players[i-1],now))?.userId??players.find(p=>!isLocked(p,now))!.userId;
 }
 let result:Receipt|undefined;
 const loops=body.action==='populate'?28:body.action==='burst'?100:1;
 for(let i=0;i<loops;i++){
  const proc=['extract','implant','decay','heal'].includes(body.action)?body.action:'rose';const def=gifts.find(g=>g.giftId==='demo-'+proc)!;
  const id=body.action==='populate'?'demo-'+i:userId;
  result=store.ingest({type:'gift',roomId:'demo',eventId:randomUUID(),giftId:def.giftId,giftName:def.name,userId:id,username:body.action==='populate'?names[i]:(store.state().players.find(p=>p.userId===id)?.username??id),coins:def.coins,timestamp:now,streak:def.streak,streakId:randomUUID(),repeatCount:body.action==='populate'?10000-i*320:body.action==='rose1000'?1000:1},now);
 }
 return result;
}
