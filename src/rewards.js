const REWARD_KEY='haru-rewards-v1';
const LEARNING_KEY='haru-language-v02';

export const REWARD_POLICY=Object.freeze({
  pointPerXp:1,
  dailyCompleteBonus:10,
  dailyCap:100,
  rewardedAdBonus:10,
  referralInviterBonus:50,
  referralFriendBonus:30,
  redemptionMinPoints:1000
});

export function rewardDefaults(){
  return{
    version:1,
    balance:0,
    lifetimeEarned:0,
    ledger:[],
    day:{date:'',earned:0},
    sync:{initialized:false,lastXp:0,lastLearningDate:'',lastDaily:{morning:false,lunch:false,evening:false}},
    integrations:{
      rewardedAds:'requires-provider',
      referrals:'requires-account-backend',
      redemption:'requires-server-ledger'
    }
  };
}

function clone(value){return JSON.parse(JSON.stringify(value));}
function todayKey(now=new Date()){return now.toISOString().slice(0,10);}
function num(value){const n=Number(value);return Number.isFinite(n)?n:0;}
function bool(value){return Boolean(value);}

export function normalizeRewardState(raw){
  const base=rewardDefaults();
  if(!raw||typeof raw!=='object')return base;
  return{
    ...base,
    ...raw,
    day:{...base.day,...(raw.day||{})},
    sync:{
      ...base.sync,
      ...(raw.sync||{}),
      lastDaily:{...base.sync.lastDaily,...(raw.sync?.lastDaily||{})}
    },
    integrations:{...base.integrations,...(raw.integrations||{})},
    ledger:Array.isArray(raw.ledger)?raw.ledger.slice(-100):[]
  };
}

export function awardPoints(state,amount,reason,eventId,now=new Date()){
  const reward=normalizeRewardState(state);
  const points=Math.max(0,Math.floor(num(amount)));
  if(!points||!eventId)return reward;
  if(reward.ledger.some(item=>item.eventId===eventId))return reward;

  const date=todayKey(now);
  if(reward.day.date!==date)reward.day={date,earned:0};

  const room=Math.max(0,REWARD_POLICY.dailyCap-num(reward.day.earned));
  const granted=Math.min(points,room);
  if(!granted)return reward;

  const entry={
    id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    eventId,
    amount:granted,
    reason:String(reason||'학습 보상'),
    at:now.toISOString()
  };
  reward.balance+=granted;
  reward.lifetimeEarned+=granted;
  reward.day.earned+=granted;
  reward.ledger=[...reward.ledger,entry].slice(-100);
  return reward;
}

export function applyLearningSnapshot(inputReward,learning,now=new Date()){
  let reward=normalizeRewardState(inputReward);
  if(!learning||typeof learning!=='object')return reward;

  const date=todayKey(now);
  if(reward.day.date!==date)reward.day={date,earned:0};

  const xp=Math.max(0,num(learning.xp));
  const learningDate=String(learning.daily?.date||date);
  const daily={
    morning:bool(learning.daily?.morning),
    lunch:bool(learning.daily?.lunch),
    evening:bool(learning.daily?.evening)
  };

  if(!reward.sync.initialized){
    reward.sync={
      initialized:true,
      lastXp:xp,
      lastLearningDate:learningDate,
      lastDaily:clone(daily)
    };
    return reward;
  }

  const previousXp=Math.max(0,num(reward.sync.lastXp));
  if(xp>previousXp){
    const delta=xp-previousXp;
    reward=awardPoints(
      reward,
      delta*REWARD_POLICY.pointPerXp,
      `학습 XP +${delta}`,
      `xp:${learningDate}:${xp}`,
      now
    );
  }

  const completed=daily.morning&&daily.lunch&&daily.evening;
  if(completed){
    reward=awardPoints(
      reward,
      REWARD_POLICY.dailyCompleteBonus,
      '오늘 3회 학습 완료 보너스',
      `daily-complete:${learningDate}`,
      now
    );
  }

  reward.sync={
    initialized:true,
    lastXp:xp,
    lastLearningDate:learningDate,
    lastDaily:clone(daily)
  };
  return reward;
}

function readJson(key){
  try{return JSON.parse(localStorage.getItem(key)||'null');}
  catch{return null;}
}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value));}

function readLearningState(){return readJson(LEARNING_KEY)||{};}
function loadRewardState(){return normalizeRewardState(readJson(REWARD_KEY));}
function saveRewardState(state){writeJson(REWARD_KEY,state);}

function syncRewards(){
  if(typeof localStorage==='undefined')return rewardDefaults();
  const current=loadRewardState();
  const next=applyLearningSnapshot(current,readLearningState(),new Date());
  saveRewardState(next);
  return next;
}

function balanceChip(reward){
  const chip=document.createElement('div');
  chip.className='reward-balance-chip';
  chip.dataset.rewardUi='balance';
  chip.innerHTML=`<span>🎁</span><b>${reward.balance}P</b>`;
  return chip;
}

function rewardSummary(reward){
  const wrap=document.createElement('section');
  wrap.className='card reward-card';
  wrap.dataset.rewardUi='summary';
  const remaining=Math.max(0,REWARD_POLICY.dailyCap-reward.day.earned);
  wrap.innerHTML=`
    <div class="reward-head">
      <div><span class="reward-eyebrow">HARU REWARD</span><h2>공부할수록 포인트가 쌓여요</h2></div>
      <strong>${reward.balance}P</strong>
    </div>
    <div class="reward-metrics">
      <div><b>${reward.day.earned}P</b><span>오늘 획득</span></div>
      <div><b>${reward.lifetimeEarned}P</b><span>누적 획득</span></div>
      <div><b>${remaining}P</b><span>오늘 남은 한도</span></div>
    </div>
    <p class="reward-note">현재는 학습 XP와 오늘 3회 완료 보너스를 포인트로 적립합니다. 하루 최대 ${REWARD_POLICY.dailyCap}P까지 적립됩니다.</p>
  `;
  return wrap;
}

function integrationCard(reward){
  const section=document.createElement('section');
  section.className='card reward-center';
  section.dataset.rewardUi='center';
  const recent=[...reward.ledger].reverse().slice(0,5);
  section.innerHTML=`
    <div class="reward-head">
      <div><span class="reward-eyebrow">리워드 센터</span><h2>${reward.balance}P 보유</h2></div>
      <span class="reward-badge">안전형 V1</span>
    </div>
    <div class="reward-action-list">
      <div class="reward-action">
        <div><b>📺 보상형 광고</b><small>광고 제공사 연동 후 시청 완료 검증 시 +${REWARD_POLICY.rewardedAdBonus}P</small></div>
        <button class="btn secondary" disabled>연동 준비중</button>
      </div>
      <div class="reward-action">
        <div><b>👥 친구 추천</b><small>친구가 실제 7일 학습을 달성하면 초대한 사람 +${REWARD_POLICY.referralInviterBonus}P / 친구 +${REWARD_POLICY.referralFriendBonus}P 예정</small></div>
        <button class="btn secondary" disabled>계정 서버 필요</button>
      </div>
      <div class="reward-action">
        <div><b>🎫 상품권 교환</b><small>${REWARD_POLICY.redemptionMinPoints}P부터 교환 예정. 서버 원장·중복/부정 검증 전에는 현금성 교환을 열지 않습니다.</small></div>
        <button class="btn secondary" disabled>교환 준비중</button>
      </div>
    </div>
    <div class="reward-ledger">
      <h3>최근 적립</h3>
      ${recent.length?recent.map(item=>`<div><span>${escapeHtml(item.reason)}</span><b>+${item.amount}P</b></div>`).join(''):'<p class="muted">아직 새로 적립된 포인트가 없습니다.</p>'}
    </div>
    <p class="reward-note">실제 상품권 지급 단계에서는 브라우저 localStorage 값이 아니라 서버의 변경 불가능한 포인트 원장을 기준으로 검증해야 합니다.</p>
  `;
  return section;
}

function escapeHtml(value){
  return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

let mounting=false;
let scheduled=false;
let rewardObserver=null;
let lastMountSignature='';

function mountRewards(){
  if(mounting||typeof document==='undefined')return;
  const app=document.querySelector('#app');
  if(!app)return;
  mounting=true;
  rewardObserver?.disconnect();
  try{
    const reward=syncRewards();
    const learning=readLearningState();
    const signature=JSON.stringify({
      tab:learning.tab||'today',
      balance:reward.balance,
      today:reward.day.earned,
      lifetime:reward.lifetimeEarned,
      lastEntry:reward.ledger.at(-1)?.id||''
    });
    const expectedView=learning.tab==='profile'?'center':learning.tab==='today'?'summary':'none';
    const uiPresent=Boolean(
      document.querySelector('[data-reward-ui="balance"]')&&
      (expectedView==='none'||document.querySelector(`[data-reward-ui="${expectedView}"]`))
    );
    if(signature===lastMountSignature&&uiPresent)return;

    document.querySelectorAll('[data-reward-ui]').forEach(node=>node.remove());

    const topbar=document.querySelector('.topbar');
    const themeButton=topbar?.querySelector('.icon-btn');
    if(topbar){
      const chip=balanceChip(reward);
      if(themeButton)topbar.insertBefore(chip,themeButton);
      else topbar.appendChild(chip);
    }

    if(learning.tab==='today'){
      const metrics=document.querySelector('.grid.three');
      if(metrics)metrics.insertAdjacentElement('afterend',rewardSummary(reward));
    }

    if(learning.tab==='profile'){
      const shell=document.querySelector('.app-shell');
      if(shell){
        const firstMetrics=shell.querySelector('.grid.three');
        const center=integrationCard(reward);
        if(firstMetrics)firstMetrics.insertAdjacentElement('afterend',center);
        else shell.appendChild(center);
      }
    }
    lastMountSignature=signature;
  }finally{
    mounting=false;
    if(rewardObserver&&app.isConnected)rewardObserver.observe(app,{childList:true,subtree:true});
  }
}

function scheduleMount(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{
    scheduled=false;
    mountRewards();
  });
}

export function initRewards(){
  if(typeof window==='undefined'||typeof document==='undefined')return;
  const start=()=>{
    mountRewards();
    const app=document.querySelector('#app');
    if(app){
      rewardObserver=new MutationObserver(scheduleMount);
      rewardObserver.observe(app,{childList:true,subtree:true});
    }
    document.addEventListener('click',()=>setTimeout(scheduleMount,0),true);
    window.addEventListener('focus',scheduleMount);
    setInterval(scheduleMount,1500);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
}

initRewards();
