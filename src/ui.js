import{LANGS,LESSONS,NAV}from'./data.js';
import{dueReviews}from'./learning.js';
import{diagnosticBand}from'./diagnostic.js';

export const $=selector=>document.querySelector(selector);

export function toast(message){
  const el=$('#toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),2200);
}

export function lessonFor(state){
  const eligible=LESSONS.filter(lesson=>lesson.level<=state.level);
  return eligible[state.lessonIndex%eligible.length]||LESSONS[0];
}

export function targetText(lesson,lang){return lesson[lang];}

export function layout(state,content){
  return`<main class="app-shell"><header class="topbar"><div class="brand"><div class="logo">하루</div><div><h1>하루언어</h1><p>한국어 · 日本語 · English</p></div></div><button class="icon-btn" data-action="theme">${state.theme==='dark'?'☀️':'🌙'}</button></header>${content}</main><nav class="bottom-nav">${NAV.map(([id,name,icon])=>`<button class="nav-btn ${state.tab===id?'active':''}" data-tab="${id}"><i>${icon}</i>${name}</button>`).join('')}</nav><div id="modalRoot"></div>`;
}

export function pairSelector(state){
  return`<div class="card"><div class="pair-select"><select class="select" data-field="source">${langOptions(state.source)}</select><button class="swap" data-action="swap" aria-label="언어 방향 바꾸기">⇄</button><select class="select" data-field="target">${langOptions(state.target)}</select></div></div>`;
}

function langOptions(value){
  return Object.entries(LANGS).map(([key,item])=>`<option value="${key}" ${value===key?'selected':''}>${item.name}</option>`).join('');
}

export function todayView(state){
  const lesson=lessonFor(state);
  const done=[state.daily.morning,state.daily.lunch,state.daily.evening].filter(Boolean).length;
  const diagnostic=state.onboarding.completed
    ? `<div class="coach-strip"><div><b>맞춤 시작 레벨 L${state.onboarding.recommendedLevel}</b><small>${diagnosticBand(state.onboarding.recommendedLevel)}</small></div><button class="btn secondary compact" data-open-diagnostic="1">다시 진단</button></div>`
    : `<div class="coach-strip attention"><div><b>먼저 3분 레벨 진단을 해보세요</b><small>결과에 맞춰 오늘 문장과 독해 난이도를 자동 조절합니다.</small></div><button class="btn primary compact" data-open-diagnostic="1">진단 시작</button></div>`;
  return`${pairSelector(state)}<section class="card hero"><h2>${greeting()} 👋</h2><p>오늘은 “${lesson.title}” 문장을 세 번에 나눠 완전히 익혀요.</p><div class="hero-row"><div class="xp-pill">🔥 ${state.streak}일 연속</div><b>${done}/3 완료</b></div></section>${diagnostic}<div class="grid three"><div class="metric"><b>${state.xp}</b><span>누적 XP</span></div><div class="metric"><b>${dueReviews(state,LESSONS).length}</b><span>복습 예정</span></div><div class="metric"><b>L${state.level}</b><span>현재 단계</span></div></div><div class="section-title"><h2>오늘의 집중 학습</h2><span>${Math.round(done/3*100)}%</span></div><div class="progress"><i style="width:${done/3*100}%"></i></div><div class="card session-list">${sessionItem('morning','🌅','아침 · 새 문장 배우기','뜻·단어·문법과 모델 음성',state.daily.morning)}${sessionItem('lunch','☀️','점심 · 기억에서 꺼내기','번역 없이 직접 문장 만들기',state.daily.lunch)}${sessionItem('evening','🌙','저녁 · 말하기와 독해','발음 분석·짧은 지문 확인',state.daily.evening)}</div><div class="section-title"><h2>오늘의 문장</h2><span>${lesson.topic}</span></div>${lessonCard(lesson,state,true)}`;
}

function sessionItem(id,icon,title,sub,done){
  return`<button class="session-item" data-session="${id}"><span class="session-icon">${done?'✅':icon}</span><span class="session-copy"><b>${title}</b><small>${sub}</small></span><span>›</span></button>`;
}

export function lessonCard(lesson,state,compact=false){
  const lines=state.settings.showAllLanguages?['ko','ja','en']:[state.target];
  return`<article class="card">${lines.map(lang=>`<div class="lang-line"><span class="lang-label">${LANGS[lang].name}</span><div class="sentence">${lesson[lang]}</div>${lang==='ja'?`<div class="reading">${lesson.jaKana}</div>`:''}<div class="actions"><button class="btn secondary" data-speak="${lang}" data-text="${enc(lesson[lang])}">🔊 듣기</button><button class="btn secondary" data-speak-slow="${lang}" data-text="${enc(lesson[lang])}">🐢 느리게</button></div></div>`).join('')}${compact?'':`<h3>핵심 단어</h3><div class="word-grid">${lesson.words.map(word=>`<div class="word"><b>${word[0]} · ${word[1]}</b><small>${word[2]}</small></div>`).join('')}</div><h3>문법 코치</h3><p class="muted">${lesson.grammar}</p>`}</article>`;
}

export function courseView(state){
  const levels=[1,2,3,4,5];
  return`${pairSelector(state)}<section class="card hero"><h2>기초부터 실전까지</h2><p>회화·단어·문법·독해·발음을 같은 문장 안에서 연결합니다.</p></section>${levels.map(level=>{const list=LESSONS.filter(lesson=>lesson.level===level);return`<div class="section-title"><h2>Level ${level}</h2><span>${list.length}개 수업</span></div><div class="card">${list.map(lesson=>`<button class="session-item" data-lesson="${lesson.id}"><span class="course-level">L${level}</span><span class="course-body"><b>${lesson.title}</b><small>${lesson.topic} · ${lesson[state.target]}</small></span><span>›</span></button>`).join('')}</div>`}).join('')}`;
}

function drillMetric(state,type,icon,name,description){
  const stat=state.drillStats?.[type]||{attempts:0,best:0};
  return`<button class="metric drill-card" data-train="${type}"><b>${icon}</b><span>${name}</span><small>${description}</small><em>${stat.attempts?`최고 ${stat.best}점`:'아직 미실행'}</em></button>`;
}

export function trainView(state){
  const lesson=lessonFor(state);
  return`${pairSelector(state)}<section class="card hero"><h2>집중 훈련</h2><p>정답을 보기 전에 직접 듣고, 조립하고, 말하고, 읽어 보세요.</p></section><div class="grid training-grid">${drillMetric(state,'pronunciation','🎙️','발음 코칭','문장·속도·끊김')}${drillMetric(state,'listening','🎧','듣기 선택','음성만 듣고 뜻 찾기')}${drillMetric(state,'assembly','🧩','문장 조립','단어 순서 만들기')}${drillMetric(state,'dictation','✍️','받아쓰기','들은 문장 입력')}${drillMetric(state,'reader','📚','리더 독해','단계별 긴 지문')}${drillMetric(state,'recall','🧠','문장 회상','번역 없이 떠올리기')}</div><div class="section-title"><h2>추천 훈련 문장</h2><span>${lesson.title}</span></div>${lessonCard(lesson,state,true)}`;
}

export function reviewView(state){
  const due=dueReviews(state,LESSONS);
  return`<section class="card hero"><h2>오답 복습</h2><p>틀린 횟수가 많은 문장부터 다시 익힙니다.</p></section>${due.length?due.map(item=>`<article class="card"><span class="lang-label">${item.type} · ${item.count}회</span><h3>${item.lesson.title}</h3><p class="muted">내 답: ${escapeHtml(item.input||'')}</p><p><b>정답:</b> ${escapeHtml(item.answer)}</p><div class="actions"><button class="btn secondary" data-review-speak="${item.index}">정답 듣기</button><button class="btn good" data-review-done="${item.index}">해결 완료</button></div></article>`).join(''):`<div class="card empty"><div style="font-size:42px">🎉</div><h3>복습할 오답이 없어요</h3><p>오늘 학습을 진행하면 취약 문장이 여기에 모입니다.</p></div>`}`;
}

export function profileView(state){
  const average=state.pronunciationHistory.length?Math.round(state.pronunciationHistory.reduce((sum,item)=>sum+item.total,0)/state.pronunciationHistory.length):0;
  const diagnosticText=state.onboarding.completed?`${state.onboarding.score}/${state.onboarding.total} · 추천 L${state.onboarding.recommendedLevel}`:'아직 진단하지 않음';
  return`<section class="card hero"><h2>학습 기록</h2><p>점수보다 반복해서 좋아지는 흐름을 확인하세요.</p></section><div class="grid three"><div class="metric"><b>${state.xp}</b><span>XP</span></div><div class="metric"><b>${state.streak}</b><span>연속일</span></div><div class="metric"><b>${average||'-'}</b><span>평균 발음</span></div></div><div class="card"><div class="setting"><div><b>레벨 진단</b><small>${diagnosticText}</small></div><button class="btn secondary" data-open-diagnostic="1">${state.onboarding.completed?'다시 하기':'시작'}</button></div><div class="setting"><div><b>표시 언어</b><small>세 언어 문장을 함께 표시</small></div><input type="checkbox" data-setting="showAllLanguages" ${state.settings.showAllLanguages?'checked':''}></div><div class="setting"><div><b>현재 레벨</b><small>학습 문장 난이도</small></div><select class="select" style="width:110px" data-setting="level">${[1,2,3,4,5].map(level=>`<option ${state.level===level?'selected':''}>${level}</option>`).join('')}</select></div><div class="setting"><div><b>데이터 초기화</b><small>기기 안의 학습 기록 삭제</small></div><button class="btn bad" data-action="reset">초기화</button></div></div><div class="section-title"><h2>최근 발음 기록</h2><span>${state.pronunciationHistory.length}회</span></div>${state.pronunciationHistory.length?`<div class="card">${state.pronunciationHistory.slice(-6).reverse().map(item=>`<div class="setting"><div><b>${item.title}</b><small>${new Date(item.at).toLocaleDateString()} · ${LANGS[item.lang].name}</small></div><strong>${item.total}점</strong></div>`).join('')}</div>`:`<div class="card empty">아직 발음 기록이 없습니다.</div>`}`;
}

function greeting(){const hour=new Date().getHours();return hour<11?'좋은 아침이에요':hour<17?'오늘도 잘하고 있어요':'저녁 복습을 시작해요';}

export function modal(content){
  return`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><div class="modal-handle"></div><div style="display:flex;justify-content:flex-end;margin-bottom:6px"><button class="icon-btn" data-action="close-modal" aria-label="닫기">✕</button></div>${content}</section></div>`;
}

export function enc(value){return encodeURIComponent(value);}
export function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
