export const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'd01', level: 1, skill: '어휘',
    prompt: '일본어 「ありがとう」의 뜻은 무엇인가요?',
    options: ['감사합니다', '미안합니다', '안녕히 가세요', '괜찮습니다'], answer: 0,
    explanation: 'ありがとう는 감사의 기본 표현입니다.'
  },
  {
    id: 'd02', level: 1, skill: '영어',
    prompt: '“만나서 반가워요”에 가장 자연스러운 영어 표현은?',
    options: ['See you yesterday.', 'Nice to meet you.', 'I am meeting nice.', 'Good night to you.'], answer: 1,
    explanation: '첫 만남에서는 Nice to meet you.를 사용합니다.'
  },
  {
    id: 'd03', level: 2, skill: '문법',
    prompt: '「日本へ行ったことがあります」가 나타내는 뜻은?',
    options: ['일본에 갈 예정입니다', '일본에 가 본 경험이 있습니다', '일본에 가지 않습니다', '일본에서 일합니다'], answer: 1,
    explanation: '동사 과거형 + ことがあります는 경험을 나타냅니다.'
  },
  {
    id: 'd04', level: 2, skill: '영어',
    prompt: '“내일 세 시에 만나는 건 어때요?”에 알맞은 영어는?',
    options: ['How about meeting at three tomorrow?', 'Why did you meet at three?', 'I met tomorrow at three.', 'Three is meeting tomorrow.'], answer: 0,
    explanation: 'How about + 동명사는 제안을 나타냅니다.'
  },
  {
    id: 'd05', level: 3, skill: '독해',
    prompt: '「雨が降っていたので、家にいました。」에서 집에 있었던 이유는?',
    options: ['날씨가 더워서', '비가 와서', '시간이 없어서', '길을 잃어서'], answer: 1,
    explanation: 'ので 앞부분이 이유이며, 雨が降っていた는 비가 오고 있었다는 뜻입니다.'
  },
  {
    id: 'd06', level: 3, skill: '문법',
    prompt: '“If you have time, let’s have lunch together.”의 핵심 문법 기능은?',
    options: ['과거 경험', '조건과 제안', '비교와 최상급', '의무와 금지'], answer: 1,
    explanation: 'if는 조건, let’s는 함께 하자는 제안입니다.'
  },
  {
    id: 'd07', level: 4, skill: '뉘앙스',
    prompt: '「たぶん道がかなり混むと思います。」에 가장 가까운 뜻은?',
    options: ['길이 반드시 막힙니다', '아마 길이 꽤 막힐 것 같습니다', '길이 전혀 막히지 않습니다', '길을 이미 막았습니다'], answer: 1,
    explanation: 'たぶん과 と思います는 확정이 아닌 추측을 부드럽게 전달합니다.'
  },
  {
    id: 'd08', level: 4, skill: '영어',
    prompt: '“Could you review this document by the end of today?”의 말투는?',
    options: ['강한 명령', '정중한 부탁', '과거 사실', '허락 거절'], answer: 1,
    explanation: 'Could you는 정중한 부탁에 자주 사용됩니다.'
  },
  {
    id: 'd09', level: 5, skill: '고급 문법',
    prompt: '「結果だけでなく、過程も評価するべきです。」의 핵심 구조는?',
    options: ['~만', '~뿐만 아니라 ~도', '~할 수 없다', '~한 적이 없다'], answer: 1,
    explanation: 'だけでなく、〜も는 “~뿐만 아니라 ~도”라는 병렬 구조입니다.'
  },
  {
    id: 'd10', level: 5, skill: '의견 표현',
    prompt: '“From a long-term perspective, this investment is worthwhile.”의 의미는?',
    options: ['단기적으로 손해가 확정됐다', '장기적 관점에서 가치가 있다', '투자를 즉시 중단해야 한다', '관점과 관계없는 사실이다'], answer: 1,
    explanation: 'from a long-term perspective는 장기적인 관점에서라는 뜻입니다.'
  }
];

export function recommendedLevel(score, total = DIAGNOSTIC_QUESTIONS.length) {
  const ratio = total ? score / total : 0;
  if (ratio < 0.25) return 1;
  if (ratio < 0.45) return 2;
  if (ratio < 0.65) return 3;
  if (ratio < 0.85) return 4;
  return 5;
}

export function diagnosticBand(level) {
  return {
    1: '문자·인사·필수 문장부터 시작',
    2: '여행·일상 회화와 기본 문법 강화',
    3: '이유·조건·의견 표현과 짧은 독해',
    4: '정중한 표현·추측·업무 회화 확장',
    5: '고급 독해·논리 전개·자연스러운 발화'
  }[level] || '기초부터 차근차근 학습';
}
