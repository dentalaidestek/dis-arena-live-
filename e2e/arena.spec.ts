import {test,expect,type Page} from '@playwright/test';
const auth={Authorization:'Bearer ui-fixture-admin'};
const ownerPassword='fixture-publisher-password';
async function ready(page:Page,path='/demo'){
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(path);
 await expect(page.locator('.leader-card')).toHaveCount(2);
 await expect.poll(async()=>Number(await page.locator('.broadcast-shell').getAttribute('data-fps')),{timeout:60000}).toBeGreaterThan(0);
 // Canvas keeps its HTML fallback in the DOM even while WebGL is rendering.
 await expect(page.getByText('3D görünüm açılamadı',{exact:true})).not.toBeVisible();
 return errors;
}
async function admin(page:Page){await page.goto('/admin?mode=demo');await page.getByLabel('Yayıncı şifresi',{exact:true}).fill(ownerPassword);await page.getByRole('button',{name:'Giriş yap',exact:true}).click();await expect(page.getByRole('heading',{name:'Yayıncı yönetimi'})).toBeVisible();}
test.beforeEach(async({request})=>{
 expect((await request.post('/api/password',{headers:auth,data:{role:'admin',password:ownerPassword}})).ok()).toBeTruthy();
 await request.post('/api/room',{headers:auth,data:{enabled:false}});
 expect((await request.post('/api/demo?mode=demo',{headers:auth,data:{action:'populate'}})).ok()).toBeTruthy();
});
test('viewer composition at desktop, 360x800, 393x873 and 1080x1920 OBS',async({page},info)=>{
 for(const [width,height,path,name] of [[1280,1000,'/arena?mode=demo','desktop'],[360,800,'/demo','phone-360'],[393,873,'/demo','phone-393'],[1080,1920,'/obs?mode=demo','obs-1080x1920']] as const){
  await page.setViewportSize({width,height});const errors=await ready(page,path);
  await expect(page.locator('input,select,button')).toHaveCount(0);await expect(page.locator('.admin-page')).toHaveCount(0);
  await expect(page.getByTestId('tooth-inspector')).toContainText('Ahmet');await expect(page.locator('.optical-label')).toContainText('28 DİŞ');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1)).toBeTruthy();
  await page.screenshot({path:info.outputPath(name+'.png')});
  if(name==='phone-393'){
   const canvas=page.locator('canvas'),bounds=(await canvas.boundingBox())!;
   await canvas.click({position:{x:bounds.width*.17,y:bounds.height*.695}});
   await expect(page.getByTestId('tooth-inspector')).toContainText('DİŞ 17');
   await page.screenshot({path:info.outputPath('tooth-inspector.png')});
  }
  expect(errors).toEqual([]);
 }
});
test('password login, mobile admin controls and logout',async({page},info)=>{
 await page.setViewportSize({width:393,height:873});await page.goto('/admin?mode=demo');await expect(page.locator('.admin-page')).toHaveCount(0);
 await page.getByLabel('Yayıncı şifresi',{exact:true}).fill('wrong-password');await page.getByRole('button',{name:'Giriş yap',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Şifre yanlış');
 await page.getByLabel('Yayıncı şifresi',{exact:true}).fill(ownerPassword);await page.getByRole('button',{name:'Giriş yap',exact:true}).click();await expect(page.locator('.admin-table tbody tr')).toHaveCount(28);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.screenshot({path:info.outputPath('admin-phone.png'),fullPage:true});
 await page.getByRole('button',{name:'Oturumu kapat',exact:true}).click();await expect(page.getByLabel('Yayıncı şifresi',{exact:true})).toBeVisible();await expect(page.locator('.admin-page')).toHaveCount(0);
});
test('automatic extraction and implant, with preserved experimental demo procedures',async({page,context,request},info)=>{
 await admin(page);const viewer=await context.newPage();await viewer.setViewportSize({width:393,height:873});const errors=await ready(viewer);
 for(const action of ['extract','implant','decay','heal']){
  await page.getByTestId('demo-'+action).click();await expect(viewer.locator('.dental-action-banner')).toBeVisible();await expect(viewer.locator('.procedure-target')).toContainText('Ahmet');await expect(viewer.locator('.procedure-target')).toContainText('11');
  await viewer.waitForTimeout(1700); // Capture the treatment phase of the 3.8s 3D procedure.
  await viewer.screenshot({path:info.outputPath(action+'.png')});await expect(viewer.locator('.dental-action-banner')).toHaveCount(0,{timeout:15000});
 }
 const state=(await (await request.get('/api/admin?mode=demo',{headers:auth})).json()).state;expect(state.players.find((p:any)=>p.userId==='demo-0').coins).toBe(10042);expect(state.players.find((p:any)=>p.userId==='demo-0').lockedUntil).toBe(0);expect(errors).toEqual([]);
});
test('fullscreen returns to admin without resetting the server round',async({page,request},info)=>{
 await admin(page);const before=(await (await request.get('/api/admin?mode=demo',{headers:auth})).json()).state;
 await page.getByRole('button',{name:'Tam ekran yayın',exact:true}).click();await expect(page.locator('.broadcast-shell')).toBeVisible();await expect(page.locator('.admin-page')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBeTruthy();await expect.poll(async()=>Number(await page.locator('.broadcast-shell').getAttribute('data-fps')),{timeout:60000}).toBeGreaterThan(0);
 await page.screenshot({path:info.outputPath('fullscreen.png')});await page.getByRole('button',{name:'Yayıncıya dön',exact:false}).click();await expect(page.locator('.admin-page')).toBeVisible();
 const after=(await (await request.get('/api/admin?mode=demo',{headers:auth})).json()).state;expect(after.roundId).toBe(before.roundId);expect(after.startedAt).toBe(before.startedAt);expect(after.players).toEqual(before.players);
});
test('viewer remains public even if legacy room credentials exist; publisher stays protected',async({page,request})=>{
 await request.post('/api/password',{headers:auth,data:{role:'viewer',password:'fixture-room-password'}});
 await page.goto('/demo');await expect(page.locator('.leader-card')).toHaveCount(4);await expect(page.locator('input,button,select')).toHaveCount(0);
 await page.goto('/admin');await expect(page.locator('.admin-page')).toHaveCount(0);await expect(page.getByLabel('Yayıncı şifresi',{exact:true})).toBeVisible();
 await request.post('/api/room',{headers:auth,data:{enabled:false}});
});

test('demo rose1000, 100 gifts, frozen winners and a clean new round',async({page,context,request})=>{
 await admin(page);const viewer=await context.newPage();await ready(viewer);
 const snapshot=async()=> (await (await request.get('/api/admin?mode=demo',{headers:auth})).json()).state;
 const total=(s:any)=>s.players.reduce((sum:number,p:any)=>sum+p.coins,0);
 const before=await snapshot();await page.getByTestId('demo-rose1000').click();
 await expect.poll(async()=>total(await snapshot())).toBe(total(before)+1000);
 await expect(page.getByTestId('demo-burst')).toBeEnabled();await page.getByTestId('demo-burst').click();
 await expect.poll(async()=>total(await snapshot())).toBe(total(before)+1100);
 await expect(page.getByTestId('demo-finish')).toBeEnabled();await page.getByTestId('demo-finish').click();
 await expect(viewer.locator('.round-finished')).toBeVisible();const finished=await snapshot();expect(finished.winners).toHaveLength(4);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Yeni tur',exact:true}).click();
 await expect.poll(async()=>(await snapshot()).roundId).not.toBe(before.roundId);
 await expect(viewer.locator('.round-finished')).toHaveCount(0);await expect(viewer.locator('.broadcast-clock strong')).toHaveText('10:00');
 expect((await snapshot()).players).toHaveLength(0);
});
