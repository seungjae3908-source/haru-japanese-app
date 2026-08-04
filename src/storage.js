const KEY='haru-language-v02';
const defaults={tab:'today',source:'ko',target:'ja',level:1,lessonIndex:0,xp:0,streak:1,theme:'light',completed:{},mistakes:[],savedWords:[],pronunciationHistory:[],daily:{date:'',morning:false,lunch:false,evening:false},settings:{showAllLanguages:true,slowRate:.72,normalRate:1}};
export function loadState(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return merge(defaults,raw)}catch{return structuredClone(defaults)}}
function merge(base,patch){const out=structuredClone(base);for(const [k,v] of Object.entries(patch||{})){if(v&&typeof v==='object'&&!Array.isArray(v)&&typeof out[k]==='object'&&!Array.isArray(out[k]))out[k]={...out[k],...v};else out[k]=v}return out}
export function saveState(state){localStorage.setItem(KEY,JSON.stringify(state))}
export function resetState(){localStorage.removeItem(KEY);return structuredClone(defaults)}
export function ensureDaily(state){const today=new Date().toISOString().slice(0,10);if(state.daily.date!==today)state.daily={date:today,morning:false,lunch:false,evening:false};return state}
