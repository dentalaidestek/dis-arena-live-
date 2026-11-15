import {test,expect,type Page} from '@playwright/test';
const auth={Authorization:'Bearer ui-fixture-admin'};
async function ready(page:Page){
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('arena-admin','ui-fixture-admin'));
 await page.goto('/?mode=demo');
 await expect(page.locator('.coin-rank')).toHaveCount(28);
 await expect.poll(async()=>Number(await page.locator('.coin-mouth').getAttribute('data-fps')),{timeout:60000}).toBeGreaterThan(0);
 await expect(page.getByText('3D görünüm açılamadı',{exact:true})).toHaveCount(0);
 return errors;
}
test.beforeEach(async({request})=>{expect((await request.post('/api/demo?mode=demo',{headers:auth,data:{action:'populate'}})).ok()).toBeTruthy()});
test('desktop clinic, readable leaderboard, controls and local assets',async({page},info)=>{
 const external:string[]=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8787')&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url())});
 const errors=await ready(page);
 await expect(page.getByTestId('quick-extract')).toBeEnabled();await expect(page.locator('.coin-rank').first()).toContainText('Ahmet');
 await page.screenshot({path:info.outputPath('desktop.png'),fullPage:true});
 expect(errors).toEqual([]);expect(external).toEqual([]);
});
test('390px phone layout has no horizontal overflow and all demo controls work',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});const errors=await ready(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Gül ×1000',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('+1000');
 await page.locator('.coin-mouth').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('phone.png'),fullPage:true});expect(errors).toEqual([]);
});
test('four sequential 3D procedures use their real target and restore both locks',async({page},info)=>{
 const errors=await ready(page);const target=page.locator('[data-user="demo-0"]');
 for(const action of ['extract','implant','decay','heal']){
  await page.getByTestId('quick-'+action).click();await expect(page.locator('.dental-action-banner')).toBeVisible();
  if(action==='extract')await expect(target).toContainText('ÇEKİLDİ');
  if(action==='decay')await expect(target).toContainText('ÇÜRÜK');
  if(action==='implant'||action==='heal')await expect(target).not.toContainText(/ÇEKİLDİ|ÇÜRÜK/);
  await page.screenshot({path:info.outputPath(action+'.png')});
  await expect(page.locator('.dental-action-banner')).toHaveCount(0,{timeout:15000});
 }
 await expect(target).toContainText('10.030');expect(errors).toEqual([]);
});
test('1080x1920 OBS frame stays inside the viewport and excludes admin controls',async({page},info)=>{
 await page.setViewportSize({width:1080,height:1920});const errors=await ready(page);await page.goto('/?view=obs&mode=demo');
 await expect(page.locator('.coin-rank')).toHaveCount(28);
 await expect.poll(async()=>Number(await page.locator('.coin-mouth').getAttribute('data-fps')),{timeout:60000}).toBeGreaterThan(0);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await expect(page.locator('.broadcaster-panel')).toHaveCount(0);await expect(page.locator('.quick-test')).toHaveCount(0);
 const canvas=await page.locator('canvas').boundingBox();expect(canvas!.height).toBeGreaterThan(700);
 await page.screenshot({path:info.outputPath('obs-1080x1920.png')});expect(errors).toEqual([]);
});
