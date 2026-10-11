const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const project=path.resolve(__dirname,'..');process.chdir(project);fs.mkdirSync('.test-artifacts',{recursive:true});
for(const name of ['verify-design','verify-player-tracks','verify-tip','verify','verify-ass','verify-automatic','verify-sync-seek','verify-clock-bridge','verify-shadow-clock']){
 console.log('\nRunning '+name);
 const result=spawnSync(process.execPath,[path.join('tests',name+'.cjs')],{cwd:project,stdio:'inherit',env:process.env,timeout:180000});
 if(result.error || result.status!==0){console.error(result.error?.message || 'Suite failed: '+name);process.exit(1);}
}
console.log('\nPASS all nine local integration suites.');
