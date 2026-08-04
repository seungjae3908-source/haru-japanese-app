(() => {
  const parts = [
    'app.part.00.txt','app.part.01.txt',
    'app.part.02a.txt','app.part.02b.txt','app.part.02c.txt',
    'app.part.03a.txt','app.part.03b.txt','app.part.03c.txt',
    'app.part.04a.txt','app.part.04b.txt'
  ];
  Promise.all(parts.map(path => fetch(`./${path}`, { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.text();
  })))
    .then(chunks => {
      const source = chunks.join('');
      new Function(source)();
    })
    .catch(error => {
      console.error(error);
      const app = document.getElementById('app');
      if (app) app.innerHTML = `<main class="app"><section class="card"><h1>앱을 불러오지 못했습니다.</h1><p>${String(error.message || error)}</p><button class="btn primary" onclick="location.reload()">다시 불러오기</button></section></main>`;
    });
})();
