export function normalize(text,lang){
  let v=String(text||'').toLowerCase().normalize('NFKC');
  if(lang==='en')return v.replace(/[^a-z0-9' ]/g,'').replace(/\s+/g,' ').trim();
  if(lang==='ja')return v.replace(/[\s。、！？!?・「」『』（）()]/g,'');
  return v.replace(/[\s.,!?~…“”"'()]/g,'');
}

export function tokenize(text,lang){
  const n=normalize(text,lang);
  if(!n)return[];
  if(lang==='en')return n.split(' ');
  return [...n];
}

export function levenshtein(a,b){
  const m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;
  for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return dp[m][n];
}

export function similarity(input,target,lang){
  const a=tokenize(input,lang),b=tokenize(target,lang);
  if(!a.length&&!b.length)return 100;
  return Math.max(0,Math.round((1-levenshtein(a,b)/Math.max(a.length,b.length,1))*100));
}

export function diffTokens(input,target,lang){
  const a=tokenize(input,lang),b=tokenize(target,lang),m=a.length,n=b.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
  let i=m,j=n,out=[];
  while(i>0||j>0){
    if(i>0&&j>0&&a[i-1]===b[j-1]){out.unshift({type:'ok',value:b[j-1]});i--;j--;}
    else if(j>0&&(i===0||dp[i][j-1]>=dp[i-1][j])){out.unshift({type:'miss',value:b[j-1]});j--;}
    else{out.unshift({type:'extra',value:a[i-1]});i--;}
  }
  return out;
}

export function dueReviews(state,lessons){
  return state.mistakes.map((m,index)=>({...m,index,lesson:lessons.find(l=>l.id===m.lessonId)})).filter(x=>x.lesson);
}

export function markMistake(state,lessonId,type,input,answer){
  const old=state.mistakes.find(m=>m.lessonId===lessonId&&m.type===type);
  if(old){old.count++;old.input=input;old.answer=answer;old.last=Date.now();}
  else state.mistakes.push({lessonId,type,input,answer,count:1,last:Date.now()});
}

export function completeSession(state,name,score){
  state.daily[name]=true;
  state.xp+=score>=80?12:score>=55?7:3;
  state.completed[name]=(state.completed[name]||0)+1;
}

export function splitAssemblyUnits(text,lang){
  const clean=String(text||'').trim();
  if(!clean)return[];
  if(lang==='en')return clean.replace(/[.!?,]/g,'').split(/\s+/).filter(Boolean);
  if(lang==='ko')return clean.replace(/[.!?,]/g,'').split(/\s+/).filter(Boolean);
  const compact=clean.replace(/[。、！？!?]/g,'');
  const chunks=[];
  let index=0;
  const sizes=[2,3,2,4,3];
  while(index<compact.length){
    const size=sizes[chunks.length%sizes.length];
    chunks.push(compact.slice(index,index+size));
    index+=size;
  }
  return chunks.filter(Boolean);
}

function hashSeed(value){
  let h=2166136261;
  for(const char of String(value)){h^=char.codePointAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}

export function seededShuffle(items,seed='haru'){
  const out=[...items];
  let s=hashSeed(seed)||1;
  const next=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};
  for(let i=out.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  if(out.length>1&&out.every((value,index)=>value===items[index]))[out[0],out[1]]=[out[1],out[0]];
  return out;
}

export function buildAssembly(text,lang,seed='haru'){
  const units=splitAssemblyUnits(text,lang).map((value,index)=>({id:`u${index}`,value}));
  return seededShuffle(units,`${seed}:${text}:${lang}`);
}

export function joinAssembly(units,lang){
  return units.map(unit=>typeof unit==='string'?unit:unit.value).join(lang==='en'||lang==='ko'?' ':'');
}

export function weakSegments(diff,lang){
  const segments=[];
  let current=[];
  const flush=()=>{
    if(!current.length)return;
    const value=current.join(lang==='en'?' ':'');
    if(value&&!segments.includes(value))segments.push(value);
    current=[];
  };
  for(const token of diff||[]){
    if(token.type==='miss')current.push(token.value);
    else flush();
  }
  flush();
  return segments.filter(Boolean).slice(0,4);
}

export function updateDrillStat(state,type,score){
  state.drillStats ||= {};
  const stat=state.drillStats[type] ||= {attempts:0,correct:0,best:0,lastScore:0};
  stat.attempts++;
  stat.lastScore=score;
  stat.best=Math.max(stat.best||0,score);
  if(score>=80)stat.correct++;
}

export function readingChoiceCorrect(story,choiceIndex){
  return Number(choiceIndex)===Number(story.answer);
}
