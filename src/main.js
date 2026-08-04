import{LANGS,LESSONS}from'./data.js';
import{loadState,saveState,resetState,ensureDaily}from'./storage.js';
import{
  similarity,markMistake,completeSession,buildAssembly,joinAssembly,seededShuffle,
  weakSegments,updateDrillStat,readingChoiceCorrect
}from'./learning.js';
import{speak,recognize,Recorder,pronunciationReport}from'./speech.js';
import{DIAGNOSTIC_QUESTIONS,recommendedLevel,diagnosticBand}from'./diagnostic.js';
import{readingStoryFor}from'./reading.js';
import{
  $,toast,lessonFor,targetText,layout,todayView,courseView,trainView,reviewView,
  profileView,lessonCard,modal,enc,escapeHtml
}from'./ui.js';

let state=ensureDaily(loadState());
let recorder=null;
let recordResult=null;
let recognized='';
let diagnosticSession=null;
let assemblySession=null;
let listeningSession=null;
let readerSession=null;
let segmentTarget='';

document.documentElement.dataset.theme=state.theme;

function persist(){saveState(state);}

function render(){
  ensureDaily(state);
  const views={today:todayView,course:courseView,train:trainView,review:reviewView,profile:profileView};
  $('#app').innerHTML=layout(state,views[state.tab](state));
  document.documentElement.dataset.theme=state.theme;
  persist();
}

function showModal(html){$('#modalRoot').innerHTML=modal(html);}
function closeModal(){const root=$('#modalRoot');if(root)root.innerHTML='';}
function closeAndRender(){closeModal();render();}

function openDiagnosticIntro(){
  showModal(`<section class="diagnostic-intro"><span class="eyebrow">첫 실행 맞춤 설정</span><h2>3분 레벨 진단</h2><p>한국어·일본어·영어의 어휘, 문법, 독해를 10문항으로 확인합니다. 결과는 시작 레벨 추천에만 사용되고 기기에 저장됩니다.</p><div class="diagnostic-benefits"><span>✓ 10문항</span><span>✓ 약 3분</span><span>✓ 언제든 재진단</span></div><button class="btn primary block" data-diagnostic-start="1">진단 시작</button><button class="btn secondary block" data-diagnostic-later="1">나중에 하기</button></section>`);
}

function startDiagnostic(){
  diagnosticSession={index:0,score:0,answers:[]};
  renderDiagnosticQuestion();
}

function renderDiagnosticQuestion(){
  const question=DIAGNOSTIC_QUESTIONS[diagnosticSession.index];
  const progress=Math.round(diagnosticSession.index/DIAGNOSTIC_QUESTIONS.length*100);
  showModal(`<div class="diagnostic-head"><span>레벨 진단</span><b>${diagnosticSession.index+1}/${DIAGNOSTIC_QUESTIONS.length}</b></div><div class="progress"><i style="width:${progress}%"></i></div><section class="card diagnostic-question"><span class="lang-label">L${question.level} · ${question.skill}</span><h2>${escapeHtml(question.prompt)}</h2><div class="option-list">${question.options.map((option,index)=>`<button class="option-btn" data-diagnostic-answer="${index}"><span>${String.fromCharCode(65+index)}</span>${escapeHtml(option)}</button>`).join('')}</div></section>`);
}

function answerDiagnostic(choice){
  const question=DIAGNOSTIC_QUESTIONS[diagnosticSession.index];
  const correct=Number(choice)===question.answer;
  if(correct)diagnosticSession.score++;
  diagnosticSession.answers.push({id:question.id,choice:Number(choice),correct});
  diagnosticSession.index++;
  if(diagnosticSession.index<DIAGNOSTIC_QUESTIONS.length){renderDiagnosticQuestion();return;}
  finishDiagnostic();
}

function finishDiagnostic(){
  const level=recommendedLevel(diagnosticSession.score,DIAGNOSTIC_QUESTIONS.length);
  state.onboarding={
    completed:true,score:diagnosticSession.score,total:DIAGNOSTIC_QUESTIONS.length,
    recommendedLevel:level,completedAt:Date.now(),answers:diagnosticSession.answers
  };
  state.level=level;
  state.lessonIndex=0;
  state.xp+=20;
  persist();
  showModal(`<section class="diagnostic-result"><div class="level-orb">L${level}</div><h2>${diagnosticSession.score}/${DIAGNOSTIC_QUESTIONS.length} 정답</h2><p><b>${diagnosticBand(level)}</b></p><p class="muted">추천 레벨은 시작점이며 내 기록에서 언제든 변경하거나 다시 진단할 수 있습니다.</p><button class="btn primary block" data-diagnostic-finish="1">추천 레벨로 시작</button></section>`);
}

function openSession(name){
  const lesson=lessonFor(state),source=targetText(lesson,state.source),target=targetText(lesson,state.target);
  if(name==='morning')showModal(`<h2>아침 · 새 문장 배우기</h2>${lessonCard(lesson,state,false)}<button class="btn primary block" data-finish-session="morning" data-score="100">학습 완료</button>`);
  if(name==='lunch')showModal(`<h2>점심 · 기억에서 꺼내기</h2><div class="card"><span class="lang-label">${LANGS[state.source].name}</span><div class="sentence">${source}</div></div><textarea id="sessionAnswer" class="text-input" placeholder="${LANGS[state.target].name}로 문장을 입력하세요"></textarea><div id="sessionFeedback"></div><div class="actions"><button class="btn secondary" data-reveal="${enc(target)}">정답 보기</button><button class="btn primary" data-check-recall="lunch">채점하기</button></div>`);
  if(name==='evening')showModal(`<h2>저녁 · 말하기와 독해</h2><div class="card"><span class="lang-label">발음 목표</span><div class="sentence">${target}</div><div class="actions"><button class="btn secondary" data-speak="${state.target}" data-text="${enc(target)}">🔊 듣기</button><button class="btn primary" data-open-pronunciation="1">🎙️ 말하기</button></div></div><div class="card"><span class="lang-label">짧은 독해</span><p class="sentence reading-text">${lesson.reading}</p><p class="reading">${lesson.readingKo}</p><p><b>${lesson.question}</b></p><textarea id="readingAnswer" class="text-input" placeholder="한국어로 답해 보세요"></textarea><div id="readingFeedback"></div><button class="btn primary block" data-check-reading="1">독해 확인</button></div>`);
}

function openTrain(type){
  const lesson=lessonFor(state),target=targetText(lesson,state.target),source=targetText(lesson,state.source);
  if(type==='pronunciation')return openPronunciation();
  if(type==='assembly')return openAssembly();
  if(type==='listening')return openListening();
  if(type==='reader')return openReader();
  if(type==='dictation')showModal(`<h2>받아쓰기</h2><div class="card"><p>모델 음성을 듣고 그대로 입력하세요.</p><button class="btn primary block" data-speak="${state.target}" data-text="${enc(target)}">🔊 문장 듣기</button></div><textarea id="trainAnswer" class="text-input" placeholder="들은 문장을 입력하세요"></textarea><div id="trainFeedback"></div><button class="btn primary block" data-check-train="dictation">채점하기</button>`);
  if(type==='recall')showModal(`<h2>문장 회상</h2><div class="card"><span class="lang-label">${LANGS[state.source].name}</span><div class="sentence">${source}</div></div><textarea id="trainAnswer" class="text-input" placeholder="${LANGS[state.target].name}로 바꿔 보세요"></textarea><div id="trainFeedback"></div><button class="btn primary block" data-check-train="recall">채점하기</button>`);
  if(type==='reading')showModal(`<h2>독해 훈련</h2><div class="card"><p class="sentence reading-text">${lesson.reading}</p><p class="reading">${lesson.readingKo}</p><p><b>${lesson.question}</b></p></div><textarea id="trainAnswer" class="text-input" placeholder="답을 입력하세요"></textarea><div id="trainFeedback"></div><button class="btn primary block" data-check-train="reading">확인하기</button>`);
}

function openAssembly(){
  const lesson=lessonFor(state),target=targetText(lesson,state.target);
  assemblySession={
    lessonId:lesson.id,target,lang:state.target,
    bank:buildAssembly(target,state.target,`${lesson.id}:${Date.now()}`),selected:[],feedback:''
  };
  renderAssembly();
}

function renderAssembly(){
  const selectedText=joinAssembly(assemblySession.selected,assemblySession.lang);
  showModal(`<h2>문장 조립</h2><p class="muted">단어 조각을 올바른 순서로 눌러 문장을 완성하세요.</p><div class="assembly-answer ${assemblySession.selected.length?'':'empty-slot'}">${assemblySession.selected.length?assemblySession.selected.map((unit,index)=>`<button class="chip selected" data-assembly-remove="${index}">${escapeHtml(unit.value)}</button>`).join(''):'여기에 선택한 조각이 표시됩니다.'}</div><div class="assembly-bank">${assemblySession.bank.map(unit=>`<button class="chip" data-assembly-pick="${unit.id}">${escapeHtml(unit.value)}</button>`).join('')}</div><p class="assembly-preview">${escapeHtml(selectedText)}</p>${assemblySession.feedback||''}<div class="actions"><button class="btn secondary" data-assembly-reset="1">처음부터</button><button class="btn primary" data-assembly-check="1" ${assemblySession.selected.length?'':'disabled'}>완성 확인</button></div>`);
}

function assemblyPick(id){
  const index=assemblySession.bank.findIndex(unit=>unit.id===id);
  if(index<0)return;
  assemblySession.selected.push(assemblySession.bank.splice(index,1)[0]);
  assemblySession.feedback='';
  renderAssembly();
}

function assemblyRemove(index){
  const unit=assemblySession.selected.splice(Number(index),1)[0];
  if(unit)assemblySession.bank.push(unit);
  assemblySession.feedback='';
  renderAssembly();
}

function checkAssembly(){
  const answer=joinAssembly(assemblySession.selected,assemblySession.lang);
  const score=similarity(answer,assemblySession.target,assemblySession.lang);
  updateDrillStat(state,'assembly',score);
  if(score<80)markMistake(state,assemblySession.lessonId,'문장 조립',answer,assemblySession.target);
  state.xp+=score>=80?12:4;
  persist();
  assemblySession.feedback=`<div class="answer-box ${score>=80?'good':'bad'}"><b>${score}점</b><br>${score>=80?'순서가 정확합니다.':'정답: '+escapeHtml(assemblySession.target)}</div>`;
  renderAssembly();
}

function openListening(){
  const lesson=lessonFor(state),target=targetText(lesson,state.target);
  const eligible=LESSONS.filter(item=>item.level<=state.level&&item.id!==lesson.id);
  const distractors=[];
  for(const item of seededShuffle(eligible,`${lesson.id}:${state.target}:listen`)){
    const text=targetText(item,state.target);
    if(text!==target&&!distractors.includes(text))distractors.push(text);
    if(distractors.length===3)break;
  }
  const options=seededShuffle([target,...distractors],`${target}:options`);
  listeningSession={lessonId:lesson.id,target,options,answered:false};
  renderListening();
}

function renderListening(){
  showModal(`<h2>듣기 선택</h2><p class="muted">문장을 보지 말고 먼저 음성만 들어 보세요.</p><button class="listen-hero" data-speak="${state.target}" data-text="${enc(listeningSession.target)}"><span>🎧</span><b>문장 재생</b><small>여러 번 들어도 괜찮아요</small></button><div class="option-list">${listeningSession.options.map((option,index)=>`<button class="option-btn" data-listening-answer="${index}" ${listeningSession.answered?'disabled':''}><span>${index+1}</span>${escapeHtml(option)}</button>`).join('')}</div><div id="listeningFeedback">${listeningSession.feedback||''}</div>`);
}

function answerListening(index){
  if(listeningSession.answered)return;
  const selected=listeningSession.options[Number(index)];
  const correct=selected===listeningSession.target;
  const score=correct?100:35;
  listeningSession.answered=true;
  updateDrillStat(state,'listening',score);
  if(!correct)markMistake(state,listeningSession.lessonId,'듣기 선택',selected,listeningSession.target);
  state.xp+=correct?12:3;
  persist();
  listeningSession.feedback=`<div class="answer-box ${correct?'good':'bad'}"><b>${correct?'정답입니다.':'다시 들어 볼 문장'}</b><br>${escapeHtml(listeningSession.target)}</div><button class="btn secondary block" data-speak-slow="${state.target}" data-text="${enc(listeningSession.target)}">🐢 느리게 다시 듣기</button>`;
  renderListening();
}

function openReader(){
  const story=readingStoryFor(state);
  readerSession={story,answered:false,feedback:''};
  renderReader();
}

function renderReader(){
  const story=readerSession.story;
  const text=story[state.target];
  showModal(`<div class="reader-head"><span class="lang-label">L${story.level} · ${story.topic}</span><h2>${story.title}</h2></div><article class="card reader-card"><p class="reader-text">${escapeHtml(text)}</p>${state.target==='ja'?`<details><summary>읽기 보기</summary><p class="reading">${escapeHtml(story.jaKana)}</p></details>`:''}<div class="actions"><button class="btn secondary" data-speak="${state.target}" data-text="${enc(text)}">🔊 지문 듣기</button><button class="btn secondary" data-speak-slow="${state.target}" data-text="${enc(text)}">🐢 느리게</button></div><h3>문맥 단어</h3><div class="word-grid">${story.keywords.map(word=>`<div class="word"><b>${word[0]} · ${word[1]}</b><small>${word[2]}</small></div>`).join('')}</div></article><section class="card"><h3>${escapeHtml(story.question)}</h3><div class="option-list">${story.options.map((option,index)=>`<button class="option-btn" data-reader-answer="${index}" ${readerSession.answered?'disabled':''}><span>${String.fromCharCode(65+index)}</span>${escapeHtml(option)}</button>`).join('')}</div>${readerSession.feedback||''}</section>`);
}

function answerReader(index){
  if(readerSession.answered)return;
  const story=readerSession.story;
  const correct=readingChoiceCorrect(story,index);
  const score=correct?100:40;
  readerSession.answered=true;
  updateDrillStat(state,'reading',score);
  state.readingProgress[story.id]={correct,score,at:Date.now()};
  if(!correct)markMistake(state,lessonFor(state).id,`리더 독해 · ${story.title}`,story.options[Number(index)],story.options[story.answer]);
  state.xp+=correct?15:4;
  persist();
  readerSession.feedback=`<div class="answer-box ${correct?'good':'bad'}"><b>${correct?'핵심을 정확히 찾았습니다.':'정답: '+escapeHtml(story.options[story.answer])}</b><br>${escapeHtml(story.explanation)}</div><button class="btn primary block" data-reader-next="1">다음 지문</button>`;
  renderReader();
}

function openPronunciation(){
  const lesson=lessonFor(state),target=targetText(lesson,state.target);
  recordResult=null;recognized='';
  showModal(`<h2>발음 코칭</h2><div class="notice">웹판은 문장 인식 정확도·속도·침묵·피치 변화량을 기초 분석합니다. 실제 음소/피치 악센트 정밀 판정은 최종 앱 단계에서 강화합니다.</div><div class="card"><span class="lang-label">${LANGS[state.target].name}</span><div class="sentence">${target}</div>${state.target==='ja'?`<div class="reading">${lesson.jaKana}</div>`:''}<div class="actions"><button class="btn secondary" data-speak="${state.target}" data-text="${enc(target)}">🔊 모델</button><button class="btn secondary" data-speak-slow="${state.target}" data-text="${enc(target)}">🐢 느리게</button></div></div><div id="recordArea"><button class="btn primary block" data-record-start="1">● 녹음 시작</button></div><div id="recognitionArea"><button class="btn secondary block" data-recognize="1">🎤 음성 인식 시작</button></div><textarea id="manualTranscript" class="text-input" placeholder="음성 인식이 안 되면 말한 문장을 직접 입력하세요"></textarea><button class="btn good block" data-analyze-pronunciation="1">발음 결과 분석</button><div id="pronunciationResult"></div>`);
}

async function startRecording(){
  try{
    recorder=new Recorder();
    await recorder.start();
    $('#recordArea').innerHTML=`<div class="recording"><span class="pulse"></span> 녹음 중…</div><button class="btn bad block" data-record-stop="1">■ 녹음 종료</button>`;
  }catch(error){toast('마이크 권한을 허용해 주세요.');}
}

async function stopRecording(){
  if(!recorder)return;
  recordResult=await recorder.stop();
  $('#recordArea').innerHTML=`<audio controls src="${recordResult.url}" style="width:100%"></audio><p class="muted">${recordResult.duration.toFixed(1)}초 녹음 · 침묵 ${Math.round(recordResult.silenceRatio*100)}%</p><button class="btn primary block" data-record-start="1">다시 녹음</button>`;
}

function startRecognition(fieldId='manualTranscript',areaId='recognitionArea',lang=state.target){
  const area=$(`#${areaId}`);
  recognize(lang,{
    onStart:()=>{if(area)area.innerHTML='<div class="recording"><span class="pulse"></span> 듣고 있어요…</div>';},
    onResult:result=>{const text=result.final||result.interim;const field=$(`#${fieldId}`);if(field)field.value=text;if(result.final)recognized=result.final;},
    onError:error=>{if(area)area.innerHTML=`<div class="answer-box bad">${escapeHtml(error.message)}</div>`;},
    onEnd:()=>{if(area)area.innerHTML=`<button class="btn secondary block" data-${areaId==='segmentRecognitionArea'?'segment-recognize':'recognize'}="1">🎤 다시 인식</button>`;}
  });
}

function analyzePronunciation(){
  const lesson=lessonFor(state),target=targetText(lesson,state.target),field=$('#manualTranscript');
  const transcript=field?.value.trim()||recognized;
  if(!transcript)return toast('인식된 문장이나 직접 입력한 문장이 필요합니다.');
  const report=pronunciationReport({transcript,target,lang:state.target,duration:recordResult?.duration||0,silenceRatio:recordResult?.silenceRatio||0,pitchVariation:recordResult?.pitchVariation||0});
  const segments=weakSegments(report.diff,state.target);
  state.pronunciationHistory.push({lessonId:lesson.id,title:lesson.title,lang:state.target,total:report.total,accuracy:report.accuracy,segments,at:Date.now()});
  state.xp+=report.total>=80?15:8;
  if(report.accuracy<80)markMistake(state,lesson.id,'발음',transcript,target);
  persist();
  const segmentHtml=segments.length?`<h3>취약 구간만 다시 연습</h3><div class="segment-list">${segments.map(segment=>`<button class="segment-card" data-segment-practice="${enc(segment)}"><b>${escapeHtml(segment)}</b><small>듣고 이 구간만 말하기</small></button>`).join('')}</div>`:`<div class="answer-box good">빠진 구간이 없습니다. 전체 문장을 자연스러운 속도로 한 번 더 말해 보세요.</div>`;
  $('#pronunciationResult').innerHTML=`<div class="card"><div class="score-row"><div class="score-ring" style="--score:${report.total}"><b>${report.total}</b></div><div class="score-copy"><h3>기초 발음 분석</h3><p class="muted">${report.note}</p></div></div><div class="breakdown"><div><b>${report.accuracy}</b><small>문장 정확도</small></div><div><b>${report.paceScore}</b><small>속도 균형</small></div><div><b>${report.silenceScore}</b><small>끊김</small></div><div><b>${report.intonationScore}</b><small>피치 변화</small></div></div><h3>문장 비교</h3><div class="diff">${report.diff.map(token=>`<span class="${token.type}">${escapeHtml(token.value)}${state.target==='en'?' ':''}</span>`).join('')}</div>${segmentHtml}</div>`;
}

function openSegmentPractice(segment){
  segmentTarget=segment;recognized='';
  showModal(`<h2>취약 구간 반복</h2><p class="muted">전체 문장 대신 이 구간만 정확하게 세 번 말해 보세요.</p><div class="segment-focus">${escapeHtml(segment)}</div><div class="actions"><button class="btn primary" data-speak-slow="${state.target}" data-text="${enc(segment)}">🐢 구간 듣기</button></div><div id="segmentRecognitionArea"><button class="btn secondary block" data-segment-recognize="1">🎤 구간 말하기</button></div><textarea id="segmentTranscript" class="text-input" placeholder="인식 결과가 표시됩니다"></textarea><button class="btn good block" data-segment-check="1">구간 확인</button><div id="segmentFeedback"></div>`);
}

function checkSegment(){
  const transcript=$('#segmentTranscript')?.value.trim()||recognized;
  if(!transcript)return toast('구간을 먼저 말해 주세요.');
  const score=similarity(transcript,segmentTarget,state.target);
  updateDrillStat(state,'segment',score);
  state.xp+=score>=80?8:2;
  persist();
  $('#segmentFeedback').innerHTML=`<div class="answer-box ${score>=80?'good':'bad'}"><b>${score}점</b><br>${score>=80?'구간 발음이 정확합니다.':'목표 구간: '+escapeHtml(segmentTarget)}</div>`;
}

function checkRecall(session='lunch'){
  const lesson=lessonFor(state),answer=$('#sessionAnswer').value,target=targetText(lesson,state.target),score=similarity(answer,target,state.target);
  if(score<80)markMistake(state,lesson.id,'문장 회상',answer,target);
  completeSession(state,session,score);persist();
  $('#sessionFeedback').innerHTML=`<div class="answer-box ${score>=80?'good':'bad'}"><b>${score}점</b><br>${score>=80?'정확하게 기억했습니다.':'정답: '+escapeHtml(target)}</div>`;
}

function checkReading(fromEvening=false){
  const lesson=lessonFor(state),element=$(fromEvening?'#readingAnswer':'#trainAnswer'),answer=element.value.trim();
  const compactAnswer=answer.replace(/\s/g,''),compactTarget=lesson.answer.replace(/\s/g,'');
  const correct=compactTarget.includes(compactAnswer)||compactAnswer.includes(compactTarget);
  if(!correct)markMistake(state,lesson.id,'독해',answer,lesson.answer);
  if(fromEvening)completeSession(state,'evening',correct?100:40);else state.xp+=correct?10:3;
  persist();
  $(fromEvening?'#readingFeedback':'#trainFeedback').innerHTML=`<div class="answer-box ${correct?'good':'bad'}">${correct?'핵심을 정확히 찾았습니다.':'정답: '+escapeHtml(lesson.answer)}</div>`;
}

function checkTrain(type){
  const lesson=lessonFor(state),answer=$('#trainAnswer').value.trim();
  if(type==='reading')return checkReading(false);
  const target=targetText(lesson,state.target),score=similarity(answer,target,state.target);
  if(score<80)markMistake(state,lesson.id,type==='dictation'?'받아쓰기':'문장 회상',answer,target);
  state.xp+=score>=80?10:3;persist();
  $('#trainFeedback').innerHTML=`<div class="answer-box ${score>=80?'good':'bad'}"><b>${score}점</b><br>${score>=80?'정답입니다.':'정답: '+escapeHtml(target)}</div>`;
}

function selectLesson(id){
  const found=LESSONS.find(lesson=>lesson.id===id);
  if(!found)return;
  state.level=Math.max(state.level,found.level);
  const eligible=LESSONS.filter(lesson=>lesson.level<=state.level);
  state.lessonIndex=Math.max(0,eligible.findIndex(lesson=>lesson.id===id));
  state.tab='today';render();scrollTo(0,0);
}

document.addEventListener('click',event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.tab){state.tab=button.dataset.tab;render();scrollTo(0,0);return;}
  if(button.dataset.action==='theme'){state.theme=state.theme==='dark'?'light':'dark';render();return;}
  if(button.dataset.action==='swap'){[state.source,state.target]=[state.target,state.source];if(state.source===state.target)state.target=state.target==='ja'?'en':'ja';render();return;}
  if(button.dataset.action==='reset'){if(confirm('학습 기록을 모두 초기화할까요?')){state=ensureDaily(resetState());closeAndRender();setTimeout(openDiagnosticIntro,60);}return;}
  if(button.dataset.action==='close-modal'){closeAndRender();return;}
  if(button.dataset.openDiagnostic){openDiagnosticIntro();return;}
  if(button.dataset.diagnosticStart){startDiagnostic();return;}
  if(button.dataset.diagnosticLater){sessionStorage.setItem('haru-diagnostic-later','1');closeModal();return;}
  if(button.dataset.diagnosticAnswer!=null){answerDiagnostic(button.dataset.diagnosticAnswer);return;}
  if(button.dataset.diagnosticFinish){closeAndRender();toast('추천 레벨로 학습을 시작합니다.');return;}
  if(button.dataset.session){openSession(button.dataset.session);return;}
  if(button.dataset.lesson){selectLesson(button.dataset.lesson);return;}
  if(button.dataset.train){openTrain(button.dataset.train);return;}
  if(button.dataset.speak){speak(decodeURIComponent(button.dataset.text),button.dataset.speak,state.settings.normalRate);return;}
  if(button.dataset.speakSlow){speak(decodeURIComponent(button.dataset.text),button.dataset.speakSlow,state.settings.slowRate);return;}
  if(button.dataset.finishSession){completeSession(state,button.dataset.finishSession,+button.dataset.score);persist();closeAndRender();toast('오늘 학습에 기록했습니다.');return;}
  if(button.dataset.reveal){toast(decodeURIComponent(button.dataset.reveal));return;}
  if(button.dataset.checkRecall){checkRecall(button.dataset.checkRecall);return;}
  if(button.dataset.openPronunciation){openPronunciation();return;}
  if(button.dataset.recordStart){startRecording();return;}
  if(button.dataset.recordStop){stopRecording();return;}
  if(button.dataset.recognize){startRecognition();return;}
  if(button.dataset.segmentRecognize){startRecognition('segmentTranscript','segmentRecognitionArea',state.target);return;}
  if(button.dataset.analyzePronunciation){analyzePronunciation();return;}
  if(button.dataset.segmentPractice){openSegmentPractice(decodeURIComponent(button.dataset.segmentPractice));return;}
  if(button.dataset.segmentCheck){checkSegment();return;}
  if(button.dataset.checkReading){checkReading(true);return;}
  if(button.dataset.checkTrain){checkTrain(button.dataset.checkTrain);return;}
  if(button.dataset.assemblyPick){assemblyPick(button.dataset.assemblyPick);return;}
  if(button.dataset.assemblyRemove!=null){assemblyRemove(button.dataset.assemblyRemove);return;}
  if(button.dataset.assemblyReset){openAssembly();return;}
  if(button.dataset.assemblyCheck){checkAssembly();return;}
  if(button.dataset.listeningAnswer!=null){answerListening(button.dataset.listeningAnswer);return;}
  if(button.dataset.readerAnswer!=null){answerReader(button.dataset.readerAnswer);return;}
  if(button.dataset.readerNext){openReader();return;}
  if(button.dataset.reviewDone){state.mistakes.splice(+button.dataset.reviewDone,1);render();toast('오답을 해결 처리했습니다.');return;}
  if(button.dataset.reviewSpeak){const item=state.mistakes[+button.dataset.reviewSpeak];if(item)speak(item.answer,state.target,.85);}
});

document.addEventListener('change',event=>{
  const element=event.target;
  if(element.dataset.field){state[element.dataset.field]=element.value;if(state.source===state.target)state.target=state.target==='ja'?'en':'ja';render();}
  if(element.dataset.setting==='showAllLanguages'){state.settings.showAllLanguages=element.checked;render();}
  if(element.dataset.setting==='level'){state.level=+element.value;state.lessonIndex=0;render();}
});

if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
if(!state.onboarding.completed&&state.settings.autoDiagnostic&&!sessionStorage.getItem('haru-diagnostic-later'))setTimeout(openDiagnosticIntro,120);
