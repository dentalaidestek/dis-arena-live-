import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'e2e',fullyParallel:false,workers:1,timeout:120000,expect:{timeout:20000},
 reporter:[['list'],['html',{open:'never'}]],outputDir:'test-results',
 use:{baseURL:'http://127.0.0.1:8787',browserName:'chromium',viewport:{width:1280,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure',launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},
 webServer:{command:'node scripts/launch.mjs --demo --no-open',url:'http://127.0.0.1:8787/api/health',reuseExistingServer:false,timeout:180000,env:{ARENA_DATA_DIR:'/tmp/arena-ui-'+process.pid,ARENA_PORT:'8787',ARENA_ADMIN_TOKEN:'ui-fixture-admin',ARENA_BRIDGE_TOKEN:'ui-fixture-bridge',ARENA_ORIGINS:'http://127.0.0.1:8787'}}
});
