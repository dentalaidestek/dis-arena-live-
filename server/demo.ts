import {createHash,randomUUID} from 'node:crypto';
import {ranked,hpOf,type Procedure} from '../src/coinArena';
import {ArenaStore,type Receipt} from './store';
const names=['Ahmet','Zeynep','Mehmet','Elif','Veli','Ali','Hasan','Cem','Deniz','Eren','Mert','Aslı','Ece','Kerem','Buse','Selin','Emre','Derya','Ayşe','Can','Ozan','İrem','Berk','Seda','Mina','Efe','Yusuf','Ada'];
const gifts=[{giftId:'demo-rose',name:'Demo Gül',coins:1,streak:true},{giftId:'demo-extract',name:'Demo Bouquet',coins:20,streak:false},{giftId:'demo-implant',name:'Demo İmplant',coins:20,streak:false},{giftId:'demo-decay',name:'TikTok',coins:1,streak:true},{giftId:'demo-heal',name:'Rose',coins:1,streak:true}];
export function runDemo(store:ArenaStore,body:{action:string;userId?:string;autoTarget?:boolean},now=Date.now()):Receipt|undefined {
 if(!['populate','extract','implant','decay','heal','rose1000','burst','finish'].includes(body.action))throw Error('Geçersiz demo işlemi');
 const catalogVersion='demo-'+createHash('sha256').update(JSON.stringify(gifts)).digest('hex').slice(0,16);
 store.setCatalog(gifts,catalogVersion,now);for(const proc of ['extract','implant','decay','heal'] as Procedure[])store.mapGift('demo-'+proc,proc,({extract:'Demo Çekim Hediyesi',implant:'Demo İmplant Hediyesi',decay:'Demo Çürütme Hediyesi',heal:'Demo İyileştirme Hediyesi'} as Record<string,string>)[proc]);
 if(body.action==='finish'){const s=store.state();if(s.startedAt)store.tick(s.startedAt+600000);return;}
 if(body.action==='populate')store.newRound(now);
 let userId=body.userId??'demo-1';
 if(body.autoTarget){
  const players=ranked(store.state());
  if(!players.length||store.state().finishedAt)throw Error('Önce 28 oyunculu demo başlatın');
  if(body.action==='implant'||body.action==='heal'){
   const condition=body.action==='implant'?'extracted':'decayed';const target=players.find(p=>condition==='extracted'?(p.condition==='extracted'||hpOf(p)===0):(p.condition==='decayed'&&hpOf(p)<100));
   if(target)userId=target.userId;
   else if(!body.userId)throw Error(body.action==='implant'?'Önce çekim yapın; ardından implantı deneyin':'Önce çürütme yapın; ardından iyileştirmeyi deneyin');
  }else userId=players.find(p=>p.condition!=='extracted'&&hpOf(p)>0)?.userId??players[0].userId;
 }
 let result:Receipt|undefined;
 const loops=body.action==='populate'?28:body.action==='burst'?100:1;
 for(let i=0;i<loops;i++){
  const proc=['extract','implant','decay','heal'].includes(body.action)?body.action:body.action==='rose1000'?'heal':'rose';const def=gifts.find(g=>g.giftId==='demo-'+proc)!;
  const id=body.action==='populate'?'demo-'+i:userId;
  result=store.ingest({type:'gift',roomId:'demo',eventId:randomUUID(),giftId:def.giftId,giftName:def.name,userId:id,username:body.action==='populate'?names[i]:(store.state().players.find(p=>p.userId===id)?.username??id),coins:def.coins,timestamp:now,streak:def.streak,streakId:randomUUID(),repeatCount:body.action==='populate'?10000-i*320:body.action==='rose1000'?1000:1},now);
 }
 return result;
}
