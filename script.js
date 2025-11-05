// script.js (web) — usa window.__QUIZ que o server injeta
const QUIZ = window.__QUIZ;
const questions = QUIZ.questions;
const categories = QUIZ.categories;
const total = questions.length;
document.getElementById('total').textContent = total;

let cur = 0;
const answers = Array(total).fill(5);
const qEl = document.getElementById('question');
const valEl = document.getElementById('val');
const range = document.getElementById('answer');
const nextBtn = document.getElementById('next');
const progressEl = document.getElementById('cur');
function showQuestion(i) {
progressEl.textContent = i+1;
qEl.textContent = questions[i].text;
range.value = answers[i];
valEl.textContent = answers[i];
}
range.addEventListener('input', (e) => {
valEl.textContent = e.target.value;
answers[cur] = Number(e.target.value);
});
nextBtn.addEventListener('click', () => {
if (cur < total-1) {
cur++;
showQuestion(cur);
} else {
finishQuiz();
}
});
function computeResult(answers) {
// same logic as server
const cats = Object.keys(categories);
const scores = {}; cats.forEach(c=>scores[c]=0);
for (let i=0;i<questions.length;i++){
const a = Math.max(0, Math.min(10, Number(answers[i]||0)));
const wmap = questions[i].weights || {};
for (const [k,w] of Object.entries(wmap)){
scores[k] += a * w;
}
}
const normalized = {};
cats.forEach(c=>{
let max = 0;

for (const q of questions) if (q.weights && q.weights[c]) max += 10
* q.weights[c];
normalized[c] = Math.round((scores[c] / (max || 1)) * 100);
});
const ranked =
Object.entries(normalized).sort((a,b)=>b[1]-a[1]).map(x=>({key:x[0],score:x[1],info:categories[x[0]]}));
return {scores,normalized,top3:ranked.slice(0,3)};
}
function finishQuiz() {
const result = computeResult(answers);
const top = result.top3[0];
document.getElementById('quizArea').classList.add('hidden');
document.getElementById('resultArea').classList.remove('hidden');
document.getElementById('resultTitle').textContent =
`${top.info.emoji} ${top.info.name} — ${top.score}%`;
document.getElementById('resultDesc').textContent = top.info.desc;
const top3 = document.getElementById('top3');
top3.innerHTML = '';
result.top3.forEach((t, i) => {
const div = document.createElement('div');
div.className = 'result-card';
div.innerHTML = `<strong>${i+1}. ${t.info.emoji}
${t.info.name}</strong> — ${t.score}%`;
top3.appendChild(div);
});
}
document.getElementById('restart').addEventListener('click', () => {
cur = 0;
for (let i=0;i<answers.length;i++) answers[i]=5;
document.getElementById('quizArea').classList.remove('hidden');
document.getElementById('resultArea').classList.add('hidden');
showQuestion(0);
});
showQuestion(0);