import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('public/app.js','utf8'),data=JSON.parse(fs.readFileSync('public/data.json'));const ctx={};vm.createContext(ctx);vm.runInContext(source.split('\n').find(line=>line.startsWith('function gearAllowedInPicker(')),ctx);
for(const color of ['DEFAULT','RANK_NEWBIE','RANK_STALKER'])assert.equal(ctx.gearAllowedInPicker({color}),false);
for(const color of ['RANK_VETERAN','RANK_MASTER','RANK_LEGEND'])assert.equal(ctx.gearAllowedInPicker({color}),true);
assert(ctx.gearAllowedInPicker({id:'',name:'No armor'}));assert(ctx.gearAllowedInPicker(undefined));
for(const name of ['Citizen','Cloak','Coat and Hat','Currant Ghillie Suit','Fractional Coloring'])assert.equal(ctx.gearAllowedInPicker(data.armor.find(item=>item.name===name)),false);
assert(source.includes("['armor','container','inventoryArmor','inventoryContainer','draftArmor','draftContainer'].includes(el.id))list=list.filter(gearAllowedInPicker)"));
console.log('Gear filters verified across all six selectors: Ordinary/green/blue hidden, higher tiers and No armor retained.');
