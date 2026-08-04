export const READING_STORIES = [
  {
    id: 'r01', level: 1, title: '아침 준비', topic: '일상',
    ko: '민수는 아침 일곱 시에 일어났습니다. 물을 한 잔 마신 뒤 가방을 챙기고 학교에 갔습니다.',
    ja: 'ミンスさんは朝七時に起きました。水を一杯飲んでから、かばんを準備して学校へ行きました。',
    jaKana: 'みんすさんは あさ しちじに おきました。みずを いっぱい のんでから、かばんを じゅんびして がっこうへ いきました。',
    en: 'Minsu got up at seven in the morning. After drinking a glass of water, he packed his bag and went to school.',
    question: '민수는 물을 마신 뒤 무엇을 했나요?',
    options: ['다시 잠들었습니다', '가방을 챙겼습니다', '운동을 했습니다', '아침을 주문했습니다'], answer: 1,
    explanation: '물을 마신 뒤 가방을 챙기고 학교에 갔다고 했습니다.',
    keywords: [['일어나다','起きる','get up'],['준비하다','準備する','prepare'],['학교','学校','school']]
  },
  {
    id: 'r02', level: 1, title: '카페 주문', topic: '식당',
    ko: '유나는 카페에서 따뜻한 차와 작은 케이크를 주문했습니다. 차가 나오기 전에 창가 자리에 앉았습니다.',
    ja: 'ユナさんはカフェで温かいお茶と小さいケーキを注文しました。お茶が来る前に窓側の席に座りました。',
    jaKana: 'ゆなさんは かふぇで あたたかい おちゃと ちいさい けーきを ちゅうもんしました。おちゃが くる まえに まどがわの せきに すわりました。',
    en: 'Yuna ordered hot tea and a small cake at a cafe. She sat by the window before the tea arrived.',
    question: '유나는 어디에 앉았나요?',
    options: ['문 앞', '주방 안', '창가 자리', '야외 계단'], answer: 2,
    explanation: '차가 나오기 전에 창가 자리에 앉았습니다.',
    keywords: [['따뜻하다','温かい','hot'],['주문하다','注文する','order'],['창가','窓側','by the window']]
  },
  {
    id: 'r03', level: 2, title: '지하철 환승', topic: '교통',
    ko: '공항에 가려면 시청역에서 파란색 노선으로 갈아타야 합니다. 세 정거장을 더 간 뒤 마지막 역에서 내립니다.',
    ja: '空港へ行くには、市庁駅で青い路線に乗り換えます。さらに三駅進んで、終点で降ります。',
    jaKana: 'くうこうへ いくには、しちょうえきで あおい ろせんに のりかえます。さらに さんえき すすんで、しゅうてんで おります。',
    en: 'To get to the airport, transfer to the blue line at City Hall Station. Travel three more stops and get off at the last station.',
    question: '어디에서 파란색 노선으로 갈아타나요?',
    options: ['공항역', '시청역', '첫 번째 역', '버스 정류장'], answer: 1,
    explanation: '시청역에서 파란색 노선으로 환승해야 합니다.',
    keywords: [['공항','空港','airport'],['갈아타다','乗り換える','transfer'],['종점','終点','last station']]
  },
  {
    id: 'r04', level: 2, title: '주말 계획 변경', topic: '약속',
    ko: '토요일에 비가 많이 올 예정이라 야외 소풍을 취소했습니다. 대신 친구들과 박물관에서 만나기로 했습니다.',
    ja: '土曜日は大雨の予報なので、外でのピクニックを中止しました。代わりに友達と博物館で会うことにしました。',
    jaKana: 'どようびは おおあめの よほうなので、そとでの ぴくにっくを ちゅうししました。かわりに ともだちと はくぶつかんで あうことに しました。',
    en: 'Heavy rain is expected on Saturday, so the outdoor picnic was canceled. Instead, the friends decided to meet at a museum.',
    question: '소풍 대신 어디에서 만나기로 했나요?',
    options: ['박물관', '공원', '해변', '학교'], answer: 0,
    explanation: '비 때문에 소풍을 취소하고 박물관에서 만나기로 했습니다.',
    keywords: [['예보','予報','forecast'],['취소하다','中止する','cancel'],['대신','代わりに','instead']]
  },
  {
    id: 'r05', level: 3, title: '업무 우선순위', topic: '업무',
    ko: '팀은 오늘 처리할 일이 많았습니다. 먼저 고객에게 보낼 보고서를 완성하고, 오후에는 다음 주 회의 자료를 검토하기로 했습니다.',
    ja: 'チームには今日中に処理する仕事がたくさんありました。まず顧客に送る報告書を完成させ、午後は来週の会議資料を確認することにしました。',
    jaKana: 'ちーむには きょうじゅうに しょりする しごとが たくさん ありました。まず こきゃくに おくる ほうこくしょを かんせいさせ、ごごは らいしゅうの かいぎしりょうを かくにんすることに しました。',
    en: 'The team had many tasks to finish today. They decided to complete the report for the client first and review next week’s meeting materials in the afternoon.',
    question: '팀이 가장 먼저 하기로 한 일은 무엇인가요?',
    options: ['회의 취소', '고객 보고서 완성', '새 직원 채용', '출장 예약'], answer: 1,
    explanation: '먼저 고객에게 보낼 보고서를 완성하기로 했습니다.',
    keywords: [['처리하다','処理する','handle'],['보고서','報告書','report'],['검토하다','確認する','review']]
  },
  {
    id: 'r06', level: 3, title: '건강한 습관', topic: '건강',
    ko: '수면 시간이 일정하지 않으면 낮에 집중하기 어렵습니다. 전문가는 주말에도 비슷한 시간에 자고 일어나는 습관을 권합니다.',
    ja: '睡眠時間が一定でないと、昼間に集中しにくくなります。専門家は週末も同じような時間に寝起きする習慣を勧めています。',
    jaKana: 'すいみんじかんが いっていでないと、ひるまに しゅうちゅうしにくく なります。せんもんかは しゅうまつも おなじような じかんに ねおきする しゅうかんを すすめています。',
    en: 'An irregular sleep schedule makes it harder to concentrate during the day. Experts recommend going to bed and waking up at similar times, even on weekends.',
    question: '전문가가 권하는 습관은 무엇인가요?',
    options: ['주말마다 밤을 새우기', '매일 다른 시간에 자기', '비슷한 시간에 자고 일어나기', '낮잠만 자기'], answer: 2,
    explanation: '주말에도 비슷한 시간에 자고 일어나는 습관을 권합니다.',
    keywords: [['수면','睡眠','sleep'],['집중하다','集中する','concentrate'],['습관','習慣','habit']]
  },
  {
    id: 'r07', level: 4, title: '의견 조율', topic: '회의',
    ko: '두 팀은 프로젝트 일정에 대해 다른 의견을 가지고 있었습니다. 논의 끝에 핵심 기능을 먼저 출시하고 나머지는 다음 단계에서 개선하기로 합의했습니다.',
    ja: '二つのチームはプロジェクトの日程について異なる意見を持っていました。話し合いの結果、主要機能を先に公開し、残りは次の段階で改善することで合意しました。',
    jaKana: 'ふたつの ちーむは ぷろじぇくとの にっていについて ことなる いけんを もっていました。はなしあいの けっか、しゅようきのうを さきに こうかいし、のこりは つぎの だんかいで かいぜんすることで ごういしました。',
    en: 'The two teams had different opinions about the project schedule. After discussion, they agreed to release the core features first and improve the rest in the next phase.',
    question: '두 팀은 무엇을 먼저 출시하기로 했나요?',
    options: ['모든 기능', '핵심 기능', '광고 기능', '다음 프로젝트'], answer: 1,
    explanation: '핵심 기능을 먼저 출시하고 나머지는 다음 단계에서 개선하기로 했습니다.',
    keywords: [['다르다','異なる','differ'],['합의하다','合意する','agree'],['핵심 기능','主要機能','core feature']]
  },
  {
    id: 'r08', level: 4, title: '정보 확인', topic: '미디어',
    ko: '온라인에서 빠르게 퍼지는 정보가 항상 정확한 것은 아닙니다. 공유하기 전에 출처와 작성 날짜를 확인하고 다른 신뢰할 만한 자료와 비교해야 합니다.',
    ja: 'オンラインで急速に広がる情報が、いつも正確とは限りません。共有する前に出典と作成日を確認し、他の信頼できる資料と比較する必要があります。',
    jaKana: 'おんらいんで きゅうそくに ひろがる じょうほうが、いつも せいかくとは かぎりません。きょうゆうする まえに しゅってんと さくせいびを かくにんし、ほかの しんらいできる しりょうと ひかくする ひつようが あります。',
    en: 'Information that spreads quickly online is not always accurate. Before sharing it, check the source and publication date and compare it with other reliable material.',
    question: '정보를 공유하기 전에 무엇을 해야 하나요?',
    options: ['제목만 읽기', '즉시 전달하기', '출처와 날짜를 확인하기', '댓글 수만 확인하기'], answer: 2,
    explanation: '출처와 작성 날짜를 확인하고 다른 신뢰할 자료와 비교해야 합니다.',
    keywords: [['출처','出典','source'],['정확하다','正確','accurate'],['비교하다','比較する','compare']]
  },
  {
    id: 'r09', level: 5, title: '장기적 성장', topic: '사회',
    ko: '짧은 기간의 성과만 강조하면 구성원은 실패를 피하는 데 집중할 수 있습니다. 장기적인 성장을 위해서는 시도와 학습 과정도 평가 기준에 포함해야 합니다.',
    ja: '短期的な成果だけを重視すると、メンバーは失敗を避けることに集中しがちです。長期的な成長のためには、挑戦と学習の過程も評価基準に含める必要があります。',
    jaKana: 'たんきてきな せいかだけを じゅうしすると、めんばーは しっぱいを さけることに しゅうちゅうしがちです。ちょうきてきな せいちょうのためには、ちょうせんと がくしゅうの かていも ひょうかきじゅんに ふくめる ひつようが あります。',
    en: 'When only short-term results are emphasized, people may focus on avoiding failure. For long-term growth, attempts and the learning process should also be included in evaluation criteria.',
    question: '장기적 성장을 위해 평가에 포함해야 하는 것은 무엇인가요?',
    options: ['결과만', '근무 시간만', '시도와 학습 과정', '실패 횟수만'], answer: 2,
    explanation: '성과뿐 아니라 시도와 학습 과정도 평가해야 한다는 내용입니다.',
    keywords: [['성과','成果','result'],['피하다','避ける','avoid'],['평가 기준','評価基準','evaluation criteria']]
  }
];

export function storiesForLevel(level) {
  return READING_STORIES.filter(story => story.level <= Math.max(1, Number(level) || 1));
}

export function readingStoryFor(state) {
  const list = storiesForLevel(state.level);
  const completed = Object.keys(state.readingProgress || {}).length;
  return list[completed % list.length] || READING_STORIES[0];
}
