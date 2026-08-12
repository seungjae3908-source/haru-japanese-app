import{LESSONS,LANGS}from'./data.js';

const LEARNING_KEY='haru-language-v02';
const REWARD_KEY='haru-rewards-v1';
const GROWTH_KEY='haru-growth-v1';
const REVIEW_INTERVALS=[1,2,4,7,16];

export function growthDefaults(){
  return{
    version:1,
    activityDates:[],
    streak:0,
    bestStreak:0,
    reviewPlans:{},
    reviewHistory:[],
    lastSyncedAt:null
  };
}

function clone(value){return JSON.parse(JSON.stringify(value));}
function readJson(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}
  catch{return null;}
}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value));}
function dateKey(now=new Date()){
  const shifted=new Date(now.getTime()-now.getTimezoneOffset()*60000);
  return shifted.toISOString().slice(0,10);
}
function addDays(date,days){
  const next=new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate()+days);
  return next.toISOString().slice(0,10);
}
function diffDays(a,b){
  const start=new Date(`${a}T12:00:00Z`).getTime();
  const end=new Date(`${b}T12:00:00Z`).getTime();
  return Math.round((end-start)/86400000);
}

export function normalizeGrowthState(raw){
  const base=growthDefaults();
  if(!raw||typeof raw!=='object')return base;
  return{
    ...base,
    ...raw,
    activityDates:Array.isArray(raw.activityDates)?[...new Set(raw.activityDates)].sort().slice(-365):[],
    reviewPlans:raw.reviewPlans&&typeof raw.reviewPlans==='object'?raw.reviewPlans:{},
    reviewHistory:Array.isArray(raw.reviewHistory)?raw.reviewHistory.slice(-100):[]
  };
}

export function computeStreak(dates){
  const unique=[...new Set((dates||[]).filter(Boolean))].sort();
  if(!unique.length)return 0;
  let streak=1;
  for(let index=unique.length-1;index>0;index--){
    if(diffDays(unique[index-1],unique[index])!==1)break;
    streak++;
  }
  return streak;
}

function currentLesson(learning){
  const level=Math.max(1,Number(learning?.level)||1);
  const eligible=LESSONS.filter(lesson=>lesson.level<=level);
  return eligible[(Number(learning?.lessonIndex)||0)%Math.max(eligible.length,1)]||LESSONS[0];
}

function sessionCount(learning){
  return['morning','lunch','evening'].filter(name=>Boolean(learning?.daily?.[name])).length;
}

export function syncGrowthState(inputGrowth,learning,now=new Date()){
  const growth=normalizeGrowthState(inputGrowth);
  if(!learning||typeof learning!=='object')return growth;

  const today=String(learning.daily?.date||dateKey(now));
  const active=sessionCount(learning)>0;
  if(active&&!growth.activityDates.includes(today)){
    growth.activityDates=[...growth.activityDates,today].sort().slice(-365);
    growth.streak=computeStreak(growth.activityDates);
    growth.bestStreak=Math.max(Number(growth.bestStreak)||0,growth.streak);
  }else if(growth.activityDates.length){
    growth.streak=computeStreak(growth.activityDates);
    growth.bestStreak=Math.max(Number(growth.bestStreak)||0,growth.streak);
  }

  const complete=sessionCount(learning)===3;
  const lesson=currentLesson(learning);
  if(complete&&lesson){
    const old=growth.reviewPlans[lesson.id];
    if(!old||old.status==='done'){
      growth.reviewPlans[lesson.id]={
        lessonId:lesson.id,
        stage:0,
        nextDue:addDays(today,REVIEW_INTERVALS[0]),
        status:'scheduled',
        scheduledFrom:today,
        lastReviewedAt:null
      };
    }
  }
  growth.lastSyncedAt=now.toISOString();
  return growth;
}

export function dueGrowthReviews(growth,learning,now=new Date()){
  const normalized=normalizeGrowthState(growth);
  const today=String(learning?.daily?.date||dateKey(now));
  return Object.values(normalized.reviewPlans)
    .filter(plan=>plan&&plan.status!=='done'&&plan.nextDue<=today)
    .map(plan=>({...plan,lesson:LESSONS.find(lesson=>lesson.id===plan.lessonId)}))
    .filter(item=>item.lesson)
    .sort((a,b)=>a.nextDue.localeCompare(b.nextDue));
}

export function reviewRemembered(inputGrowth,lessonId,now=new Date()){
  const growth=normalizeGrowthState(inputGrowth);
  const plan=growth.reviewPlans[lessonId];
  if(!plan||plan.status==='done')return growth;
  const reviewedDate=dateKey(now);
  const nextStage=Number(plan.stage||0)+1;
  if(nextStage>=REVIEW_INTERVALS.length){
    growth.reviewPlans[lessonId]={...plan,stage:nextStage,status:'done',lastReviewedAt:now.toISOString(),nextDue:null};
  }else{
    growth.reviewPlans[lessonId]={
      ...plan,
      stage:nextStage,
      status:'scheduled',
      lastReviewedAt:now.toISOString(),
      nextDue:addDays(reviewedDate,REVIEW_INTERVALS[nextStage])
    };
  }
  growth.reviewHistory=[...growth.reviewHistory,{lessonId,result:'remembered',at:now.toISOString()}].slice(-100);
  return growth;
}

export function reviewAgain(inputGrowth,lessonId,now=new Date()){
  const growth=normalizeGrowthState(inputGrowth);
  const plan=growth.reviewPlans[lessonId];
  if(!plan||plan.status==='done')return growth;
  growth.reviewPlans[lessonId]={...plan,status:'scheduled',lastReviewedAt:now.toISOString(),nextDue:addDays(dateKey(now),1)};
  growth.reviewHistory=[...growth.reviewHistory,{lessonId,result:'again',at:now.toISOString()}].slice(-100);
  return growth;
}

function totalDrillAttempts(learning){
  return Object.values(learning?.drillStats||{}).reduce((sum,stat)=>sum+(Number(stat?.attempts)||0),0);
}
function totalCompletedSessions(learning){
  return Object.values(learning?.completed||{}).reduce((sum,value)=>sum+(Number(value)||0),0);
}

function badgeList(learning,growth){
  const completed=totalCompletedSessions(learning);
  const drills=totalDrillAttempts(learning);
  const pronunciation=Array.isArray(learning?.pronunciationHistory)?learning.pronunciationHistory.length:0;
  return[
    {icon:'🌱',name:'첫 발걸음',desc:'집중 세션 1회 완료',unlocked:completed>=1},
    {icon:'🔥',name:'3일 연속',desc:'3일 연속 학습',unlocked:growth.streak>=3},
    {icon:'🧠',name:'훈련 습관',desc:'집중 훈련 10회',unlocked:drills>=10},
    {icon:'🎙️',name:'말하기 시작',desc:'발음 분석 5회',unlocked:pronunciation>=5},
    {icon:'🏅',name:'꾸준한 학습자',desc:'집중 세션 30회',unlocked:completed>=30}
  ];
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function missionCard(learning,growth){
  const done=sessionCount(learning);
  const due=dueGrowthReviews(growth,learning).length;
  const items=[
    {label:'아침 문장 배우기',done:Boolean(learning?.daily?.morning)},
    {label:'점심 기억 꺼내기',done:Boolean(learning?.daily?.lunch)},
    {label:'저녁 말하기·독해',done:Boolean(learning?.daily?.evening)}
  ];
  const section=document.createElement('section');
  section.className='card growth-mission';
  section.dataset.growthUi='mission';
  section.innerHTML=`
    <div class="growth-title"><div><span class="growth-eyebrow">오늘의 미션</span><h2>${done}/3 완료</h2></div><strong>🔥 ${growth.streak}일</strong></div>
    <div class="growth-mission-list">${items.map(item=>`<div class="growth-mission-item ${item.done?'done':''}"><span>${item.done?'✅':'○'}</span><b>${item.label}</b></div>`).join('')}</div>
    <p class="growth-note">예정 복습 ${due}개 · 최고 연속 ${growth.bestStreak}일</p>
  `;
  return section;
}

function reviewSection(learning,growth){
  const due=dueGrowthReviews(growth,learning);
  if(!due.length)return null;
  const section=document.createElement('section');
  section.className='growth-review-wrap';
  section.dataset.growthUi='reviews';
  section.innerHTML=`<div class="section-title"><h2>간격 반복 복습</h2><span>${due.length}개 예정</span></div>${due.map(item=>{
    const lesson=item.lesson;
    const source=lesson[learning.source]||lesson.ko;
    const target=lesson[learning.target]||lesson.ja;
    return`<article class="card growth-review-card" data-growth-review-card="${escapeHtml(lesson.id)}"><span class="growth-eyebrow">${escapeHtml(item.nextDue)} 복습</span><h3>${escapeHtml(lesson.title)}</h3><p class="growth-prompt">${escapeHtml(source)}</p><div class="growth-answer" hidden><b>${escapeHtml(LANGS[learning.target]?.name||learning.target)}</b><p>${escapeHtml(target)}</p>${learning.target==='ja'?`<small>${escapeHtml(lesson.jaKana||'')}</small>`:''}</div><div class="actions"><button class="btn secondary" data-growth-reveal="${escapeHtml(lesson.id)}">정답 보기</button><button class="btn secondary" data-growth-again="${escapeHtml(lesson.id)}">내일 다시</button><button class="btn good" data-growth-remembered="${escapeHtml(lesson.id)}">기억했어요</button></div></article>`;
  }).join('')}`;
  return section;
}

function badgeSection(learning,growth){
  const badges=badgeList(learning,growth);
  const unlocked=badges.filter(item=>item.unlocked).length;
  const section=document.createElement('section');
  section.className='card growth-badges';
  section.dataset.growthUi='badges';
  section.innerHTML=`<div class="growth-title"><div><span class="growth-eyebrow">무료 성장 기록</span><h2>배지 ${unlocked}/${badges.length}</h2></div><strong>최고 ${growth.bestStreak}일</strong></div><div class="growth-badge-grid">${badges.map(item=>`<div class="growth-badge ${item.unlocked?'unlocked':'locked'}"><span>${item.icon}</span><b>${item.name}</b><small>${item.desc}</small></div>`).join('')}</div>`;
  return section;
}

function backupSection(){
  const section=document.createElement('section');
  section.className='card growth-backup';
  section.dataset.growthUi='backup';
  section.innerHTML=`<div class="growth-title"><div><span class="growth-eyebrow">무료 로컬 백업</span><h2>학습 기록 백업·복원</h2></div></div><p class="growth-note">외부 유료 클라우드를 사용하지 않고 JSON 파일로 직접 보관합니다.</p><div class="actions"><button class="btn secondary" data-growth-export="1">백업 내보내기</button><button class="btn secondary" data-growth-import="1">백업 불러오기</button></div><input type="file" accept="application/json,.json" data-growth-file hidden>`;
  return section;
}

function exportBackup(){
  const payload={
    app:'haru-language',version:1,exportedAt:new Date().toISOString(),
    learning:readJson(LEARNING_KEY)||{},
    rewards:readJson(REWARD_KEY)||{},
    growth:readJson(GROWTH_KEY)||{}
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=`haru-language-backup-${dateKey()}.json`;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function importBackup(file){
  if(!file)return;
  const text=await file.text();
  const payload=JSON.parse(text);
  if(payload?.app!=='haru-language'||Number(payload?.version)!==1)throw new Error('하루언어 백업 파일이 아닙니다.');
  if(!payload.learning||typeof payload.learning!=='object')throw new Error('학습 데이터가 없습니다.');
  writeJson(LEARNING_KEY,payload.learning);
  if(payload.rewards&&typeof payload.rewards==='object')writeJson(REWARD_KEY,payload.rewards);
  if(payload.growth&&typeof payload.growth==='object')writeJson(GROWTH_KEY,payload.growth);
  location.reload();
}

let observer=null;
let scheduled=false;
let mounting=false;
let lastSignature='';

function sync(){
  const learning=readJson(LEARNING_KEY)||{};
  let growth=normalizeGrowthState(readJson(GROWTH_KEY));
  growth=syncGrowthState(growth,learning,new Date());
  writeJson(GROWTH_KEY,growth);
  if(Number(learning.streak||0)!==growth.streak){
    learning.streak=growth.streak||1;
    writeJson(LEARNING_KEY,learning);
  }
  return{learning,growth};
}

function mount(){
  if(mounting||typeof document==='undefined')return;
  const app=document.querySelector('#app');
  if(!app)return;
  mounting=true;observer?.disconnect();
  try{
    const{learning,growth}=sync();
    const due=dueGrowthReviews(growth,learning).length;
    const signature=JSON.stringify({tab:learning.tab||'today',daily:learning.daily,streak:growth.streak,best:growth.bestStreak,due,history:growth.reviewHistory.length,xp:learning.xp,drills:totalDrillAttempts(learning),pronunciation:learning.pronunciationHistory?.length||0});
    const expected=learning.tab==='today'?'mission':learning.tab==='review'&&due?'reviews':learning.tab==='profile'?'badges':'none';
    const uiPresent=expected==='none'||Boolean(document.querySelector(`[data-growth-ui="${expected}"]`));
    if(signature===lastSignature&&uiPresent){
      const streak=document.querySelector('.xp-pill');
      if(streak)streak.textContent=`🔥 ${growth.streak||1}일 연속`;
      return;
    }

    document.querySelectorAll('[data-growth-ui]').forEach(node=>node.remove());
    const streak=document.querySelector('.xp-pill');
    if(streak)streak.textContent=`🔥 ${growth.streak||1}일 연속`;

    if(learning.tab==='today'){
      const progress=document.querySelector('.progress');
      if(progress)progress.insertAdjacentElement('afterend',missionCard(learning,growth));
    }
    if(learning.tab==='review'){
      const shell=document.querySelector('.app-shell');
      const reviews=reviewSection(learning,growth);
      if(shell&&reviews){
        const hero=shell.querySelector('.hero');
        if(hero)hero.insertAdjacentElement('afterend',reviews);else shell.appendChild(reviews);
      }
    }
    if(learning.tab==='profile'){
      const shell=document.querySelector('.app-shell');
      const firstMetrics=shell?.querySelector('.grid.three');
      const badges=badgeSection(learning,growth);
      const backup=backupSection();
      if(firstMetrics){firstMetrics.insertAdjacentElement('afterend',badges);badges.insertAdjacentElement('afterend',backup);}
      else if(shell){shell.append(badges,backup);}
    }
    lastSignature=signature;
  }finally{
    mounting=false;
    if(observer&&app.isConnected)observer.observe(app,{childList:true,subtree:true});
  }
}

function scheduleMount(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;mount();});
}

function saveGrowth(growth){writeJson(GROWTH_KEY,normalizeGrowthState(growth));lastSignature='';scheduleMount();}

export function initGrowth(){
  if(typeof window==='undefined'||typeof document==='undefined')return;
  const start=()=>{
    mount();
    const app=document.querySelector('#app');
    if(app){observer=new MutationObserver(scheduleMount);observer.observe(app,{childList:true,subtree:true});}
    document.addEventListener('click',event=>{
      const button=event.target.closest('button');
      if(!button)return;
      if(button.dataset.growthReveal){
        const card=document.querySelector(`[data-growth-review-card="${CSS.escape(button.dataset.growthReveal)}"]`);
        const answer=card?.querySelector('.growth-answer');
        if(answer)answer.hidden=false;
        return;
      }
      if(button.dataset.growthRemembered){saveGrowth(reviewRemembered(readJson(GROWTH_KEY),button.dataset.growthRemembered,new Date()));return;}
      if(button.dataset.growthAgain){saveGrowth(reviewAgain(readJson(GROWTH_KEY),button.dataset.growthAgain,new Date()));return;}
      if(button.dataset.growthExport){exportBackup();return;}
      if(button.dataset.growthImport){document.querySelector('[data-growth-file]')?.click();return;}
      setTimeout(scheduleMount,0);
    },true);
    document.addEventListener('change',event=>{
      if(!event.target.matches?.('[data-growth-file]'))return;
      importBackup(event.target.files?.[0]).catch(error=>alert(error.message||'백업을 불러오지 못했습니다.'));
    });
    window.addEventListener('focus',scheduleMount);
    setInterval(scheduleMount,2000);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}

if(typeof window!=='undefined')initGrowth();
