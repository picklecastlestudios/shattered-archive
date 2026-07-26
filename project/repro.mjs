import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 780, height: 439 } });
const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('http://localhost:5199/'); await p.waitForTimeout(1600);
const SAVE = {schema:1,name:"Pickles",palette:0,character:"pickles",outfit:1,chose:true,outfitsUnlocked:2,muted:true,journal:{"vestibule|specificity":{miss:2,mended:true},"cowork-caverns|cloud-vs-computer":{miss:1,mended:true},"cowork-caverns|file-handling":{miss:1,mended:true}},companion:"cowork-caverns",flags:{tut_move:1,tut_q:1,tut_tech:1,tut_miss:1,tut_redeem:1,tut_surge:1,tech_vestibule:1,chest_vestibule:1,tut_kit:1,"chest_hall-of-memory":1,"tech_hall-of-memory":1,tut_mend:1,"tech_cowork-caverns":1},cleared:["vestibule","hall-of-memory","cowork-caverns"],cycle:0,highestCycle:0,stats:{answered:40,correct:36,bossesDown:4,finishers:0,duels:2},log:[],updatedAt:"x"};
await p.evaluate((s)=>{localStorage.clear();localStorage.setItem('claude_quest_save_v1',JSON.stringify(s));const g=window.game;g.scene.getScenes(true).forEach(x=>g.scene.stop(x.scene.key));g.scene.start('overworld',{zoneIdx:0});}, SAVE);
await p.waitForTimeout(1200);
const entered = await p.evaluate(()=>{const s=window.game.scene.getScene('overworld');return {active:window.game.scene.isActive('overworld'), wisp:!!s.wisp, hotspots:s.hotspots.map(h=>h.label)};});
console.log('ZONE ENTRY:', JSON.stringify(entered));
await p.screenshot({path:'shots/fix1_zone_entry.png'});
// start the duel (the echo wisp)
await p.evaluate(()=>window.game.scene.getScene('overworld').startDuel());
await p.waitForTimeout(300); await p.keyboard.press('e'); await p.waitForTimeout(400); // dismiss intro -> Q1
await p.screenshot({path:'shots/fix2_duel_q1.png'});
// answer Q1 via number key, ensure it advances (no freeze)
const before = await p.evaluate(()=>window.game.scene.getScene('overworld').quizOpen);
await p.evaluate(()=>{const s=window.game.scene.getScene('overworld');s.duelPick(s.duelCorrectSlot);});
await p.waitForTimeout(900);
const q2open = await p.evaluate(()=>window.game.scene.getScene('overworld').quizOpen);
console.log('duel advanced (Q1 correct -> still open for Q2):', before, '->', q2open);
// finish the duel to confirm quizOpen resets (no lingering freeze)
for(let i=0;i<3;i++){await p.evaluate(()=>{const s=window.game.scene.getScene('overworld');if(s.duelPick)s.duelPick(s.duelCorrectSlot??0);});await p.waitForTimeout(900);const w=await p.evaluate(()=>!!window.game.scene.getScene('overworld').quizWait);if(w){await p.keyboard.press('e');await p.waitForTimeout(500);}}
await p.waitForTimeout(600);
const after = await p.evaluate(()=>{const s=window.game.scene.getScene('overworld');return {quizOpen:s.quizOpen, dlgOpen:s.dlgOpen};});
console.log('AFTER DUEL:', JSON.stringify(after), '(quizOpen must be false = not frozen)');
console.log('errors:', errs.length, errs.slice(0,3));
await b.close();
