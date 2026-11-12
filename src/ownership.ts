export type ToothOwner={userId:string;username:string;claimedAt:number};
export type Ownership=Record<number,ToothOwner>;
export type ClaimResult={accepted:boolean;message:string;owners:Ownership;toothId:number|null};
export const normalizeUsername=(value:string)=>value.trim().replace(/^@+/,'').toLocaleLowerCase('tr-TR');
export function claimTooth(owners:Ownership,toothId:number,userId:string,username:string,now:number,extracted=false):ClaimResult{
 const fail=(message:string):ClaimResult=>({accepted:false,message,owners,toothId:null});
 if(!Number.isInteger(toothId)||toothId<0||toothId>=32)return fail('Geçersiz diş');
 if(extracted)return fail('Çekilmiş diş sahiplenilemez');
 const name=normalizeUsername(username);
 if(!userId.trim()||userId.length>128||!name||name.length>40||!Number.isFinite(now)||now<0)return fail('Geçersiz kullanıcı');
 const existing=Object.entries(owners).find(([,owner])=>owner.userId===userId);
 if(existing)return fail('Kullanıcı zaten '+(Number(existing[0])+1)+'. dişin sahibi');
 if(owners[toothId])return fail('Dişin sahibi zaten var');
 return {accepted:true,message:'@'+name+' '+(toothId+1)+'. dişi sahiplendi',owners:{...owners,[toothId]:{userId,username:name,claimedAt:now}},toothId};
}
export const ownerLabel=(owners:Ownership,id:number)=>owners[id]?'@'+owners[id].username:'SAHİPSİZ';
export const ownerCount=(owners:Ownership)=>Object.keys(owners).length;
