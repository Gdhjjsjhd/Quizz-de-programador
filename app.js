// app.js
// Uso:
// node app.js -> inicia servidor web em http://localhost:3000
// node app.js --cli -> executa quiz no terminal (readline)
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 3000;
// --- dados do quiz (mesmos usados pela versão web e CLI) ---
const QUIZ = {
    categories: {
        frontend: { name: "Front-end", emoji: "🎨", desc: "Você vive de pixels, animações e luta com o CSS." },
        backend: { name: "Back-end", emoji: "⚙️", desc: "Você ama lógica, APIs e bancos de dados." },
        fullstack: { name: "Full Stack", emoji: "💻", desc: "Você quer fazer tudo e sofre um pouco por isso." },
        mobile: { name: "Mobile", emoji: "📱", desc: "Você vive de emuladores e builds que quebram." },
        games: { name: "Game Dev", emoji: "🎮", desc: "Você pensa em FPS e frame-rates até no almoço." },
        qa: { name: "QA / Tester", emoji: "🔎", desc: "Seu prazer é encontrar edge-cases e bugs." },
        devops: { name: "DevOps", emoji: "☁️", desc: "Docker, CI/CD e infraestrutura são seu playground." },
        lead: { name: "Tech Lead", emoji: "🧭", desc: "Você coordena, prioriza e perde o hábito de codar." },
        data: { name: "Data / ML", emoji: "📊", desc: "Gráficos, modelos e pipelines — tudo pipelined." },
        security: { name: "Ethical Hacker", emoji: "🛡️", desc: "Você pensa como invasor e protege como herói." },
        devrel: { name: "DevRel / Community", emoji: "📣", desc: "Você ama palestrar e transformar docs em arte." },
        desktop: { name: "Desktop / SW", emoji: "🖥️", desc: "Aplicativos nativos e desempenho são seu forte." },
        none: { name: "Nada na tech (híbrido)", emoji: "😅", desc: "Você se perde entre áreas — e tá tudo bem." }
    },
    // Perguntas: texto + pesos por categoria (soma de pesos influencia o impacto)
    questions: [
        { text: "1) Quanto você gosta de deixar as coisas bonitas e organizadas na tela? (0-10)", weights: { frontend: 2, web: 1 } },
        { text: "2) Quanto você gosta de pensar em lógica, números e resolver problemas? (0-10)", weights: { backend: 2, data: 1 } },
        { text: "3) Você curte mexer em tudo um pouco e descobrir como ascoisas se conectam? (0-10)", weights: { fullstack: 3 } },
        { text: "4) Você gosta da ideia de fazer aplicativos pra celular?(0-10)", weights: { mobile: 3 } },
        { text: "5) Você gosta de criar jogos, fases e personagens? (0-10)", weights: { games: 3 } },
        { text: "6) Você gosta de testar programas e encontrar errosescondidos? (0-10)", weights: { qa: 3 } },
        { text: "7) Você gosta de ajudar os colegas quando o computador ousistema não funciona? (0-10)", weights: { devops: 3 } },
        { text: "8) Você se vê liderando um grupo e ajudando a tomardecisões? (0-10)", weights: { lead: 3 } },
        { text: "9) Você acha legal trabalhar com dados, gráficos e descobrirpadrões? (0-10)", weights: { data: 3 } },
        { text: "10) Você tem curiosidade em segurança digital, senhas ehackers do bem? (0-10)", weights: { security: 3 } },
        { text: "11) Você gosta de explicar tecnologia pros outros ouensinar? (0-10)", weights: { devrel: 3 } },
        { text: "12) Você gosta de fazer programas que rodam direto no computador (sem internet)? (0-10)", weights: { desktop: 3 } },
        { text: "13) Você ainda tá meio perdido e não sabe direito o que querna tecnologia? (0-10)", weights: { none: 3 } },
        { text: "14) Você gosta de inventar ideias novas e transformar emprojetos reais? (0-10)", weights: { fullstack: 2, lead: 1 } },
        { text: "15) Você gosta de internet, sites e ver como tudo seconecta? (0-10)", weights: { frontend: 1, web: 2 } },
    ]};
// --- util: calcula resultado final a partir das respostas (array denumbers 0..10)
function computeResult(answers) {
    const categories = Object.keys(QUIZ.categories);
    const scores = {};
    categories.forEach(c => scores[c] = 0);
    // acumula
    for (let i = 0; i < QUIZ.questions.length; i++) {
        const a = Math.max(0, Math.min(10, Number(answers[i] || 0)));
        const wmap = QUIZ.questions[i].weights || {};
        for (const [k, w] of Object.entries(wmap)) {
            scores[k] += a * w;
        }
    }
    // calcular percentual relativo ao máximo possível
    const maxScores = {};
    categories.forEach(c => {
        let max = 0;
        for (const q of QUIZ.questions) {
            if (q.weights && q.weights[c]) max += 10 * q.weights[c];
        }
        maxScores[c] = max || 1;
    });
    const normalized = {};
    categories.forEach(c => {
        normalized[c] = Math.round((scores[c] / maxScores[c]) * 100);
    });
    // ordenar por maior normalized
    const ranked = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    // construir resultado: top3
    const top3 = ranked.slice(0, 3).map(([k, v]) => ({
        key: k, score: v,
        info: QUIZ.categories[k]
    }));
    return { scores, normalized, top3 };
}
// --- Modo CLI ---

function runCli() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin, output:
            process.stdout
    });
    console.log("\n=== QUIZ: Quem é você na Tecnologia? (modo CLI)===\n");
    const answers = [];
    let i = 0;
    function ask() {
        if (i >= QUIZ.questions.length) {
            const result = computeResult(answers);
            showResultCli(result);
            rl.close();
            return;
        }
        const q = QUIZ.questions[i].text + " ";
        rl.question(q, (ans) => {
            const n = Number(ans);
            if (isNaN(n) || n < 0 || n > 10) {
                console.log("Responda com um número entre 0 e 10.");
                ask();
                return;
            }
            answers.push(n);
            i++;
            ask();
        });
    }
    ask();
    function showResultCli(result) {
        console.log("\n=== Resultado ===\n");
        const top = result.top3[0];
        console.log(`${top.info.emoji} Você é: ${top.info.name}
(${top.score}%)`);
        console.log(top.info.desc);
        console.log("\nTop 3:");
        result.top3.forEach((t, idx) => {
            console.log(`${idx + 1}) ${t.info.emoji} ${t.info.name} —
${t.score}%`);
        });

        console.log("\nDetalhes por categoria (normalizado 0-100):");
        console.table(result.normalized);
        console.log("\nObrigado por jogar! Rode novamente para ver variações.\n");
}
}
// --- Servidor estático simples para web version ---
function serveWeb() {
    const server = http.createServer((req, res) => {
        let urlPath = req.url;
        if (urlPath === '/') urlPath = '/index.html';
        const safePath = path.join(__dirname, 'web', urlPath);
        fs.readFile(safePath, (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.end('Not found');
                return;
            }
            const ext = path.extname(safePath).toLowerCase();
            const mime = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml',
                '.json': 'application/json'
            }[ext] || 'text/plain';
            res.setHeader('Content-Type', mime + '; charset=utf-8');
// If index.html, we want to inject the QUIZ data so the web script can use it
            if (path.basename(safePath) === 'index.html') {
                // read index.html and replace placeholder <!--QUIZ-DATA-->
                let html = data.toString();
                html = html.replace('<!--QUIZ-DATA-->', `<script>window.__QUIZ = ${JSON.stringify(QUIZ)};</script>`);
                res.end(html);
            } else {
                res.end(data);
            }
        });

    });
    server.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT} — abra no
navegador`);
    });
}
// --- main: decide modo por args ---
const args = process.argv.slice(2);
if (args.includes('--cli')) {
    runCli();
} else {
    serveWeb();
}