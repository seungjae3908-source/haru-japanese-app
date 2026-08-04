const KEY='haru-language-v02';
const defaults={
  tab:'today',source:'ko',target:'ja',level:1,lessonIndex:0,xp:0,streak:1,theme:'light',
  completed:{},mistakes:[],savedWords:[],pronunciationHistory:[],
  daily:{date:'',morning:false,lunch:false,evening:false},
  onboarding:{completed:false,score:0,total:10,recommendedLevel:1,completedAt:null},
  drillStats:{
    assembly:{attempts:0,correct:0,best:0,lastScore:0},
    listening:{attempts:0,correct:0,best:0,lastScore:0},
    reading:{attempts:0,correct:0,best:0,lastScore:0},
    segment:{attempts:0,correct:0,best:0,lastScore:0}
  },
  readingProgress:{},
  settings:{showAllLanguages:true,slowRate:.72,normalRate:1,autoDiagnostic:true}
};

export function loadState(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
    return deepMerge(defaults,raw);
  }catch{
    return structuredClone(defaults);
  }
}

function isPlain(value){return value&&typeof value==='object'&&!Array.isArray(value);}

function deepMerge(base,patch){
  const out=structuredClone(base);
  for(const [key,value] of Object.entries(patch||{})){
    if(isPlain(value)&&isPlain(out[key]))out[key]=deepMerge(out[key],value);
    else out[key]=value;
  }
  return out;
}

export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state));}
export function resetState(){localStorage.removeItem(KEY);return structuredClone(defaults);}
export function ensureDaily(state){
  const today=new Date().toISOString().slice(0,10);
  if(state.daily.date!==today)state.daily={date:today,morning:false,lunch:false,evening:false};
  return state;
}
