// ==============================================
// LEITOR BÍBLICO IMERSIVO - VERBUM AI
// ==============================================

// Inicializa Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Dados Bíblicos - Plano de Leitura Anual
const DB = {
    domingo: { nome: "Epístolas", livros: [{l:"Romanos", c:16}, {l:"1 Coríntios", c:16}, {l:"2 Coríntios", c:13}, {l:"Gálatas", c:6}, {l:"Efésios", c:6}, {l:"Filipenses", c:4}, {l:"Colossenses", c:4}, {l:"1 Tessalonicenses", c:5}, {l:"2 Tessalonicenses", c:3}, {l:"1 Timóteo", c:6}, {l:"2 Timóteo", c:4}, {l:"Tito", c:3}, {l:"Filemom", c:1}, {l:"Hebreus", c:13}, {l:"Tiago", c:5}, {l:"1 Pedro", c:5}, {l:"2 Pedro", c:3}, {l:"1 João", c:5}, {l:"2 João", c:1}, {l:"3 João", c:1}, {l:"Judas", c:1}] },
    segunda: { nome: "Pentateuco", livros: [{l:"Gênesis", c:50}, {l:"Êxodo", c:40}, {l:"Levítico", c:27}, {l:"Números", c:36}, {l:"Deuteronômio", c:34}] },
    terca: { nome: "História", livros: [{l:"Josué", c:24}, {l:"Juízes", c:21}, {l:"Rute", c:4}, {l:"1 Samuel", c:31}, {l:"2 Samuel", c:24}, {l:"1 Reis", c:22}, {l:"2 Reis", c:25}, {l:"1 Crônicas", c:29}, {l:"2 Crônicas", c:36}, {l:"Esdras", c:10}, {l:"Neemias", c:13}, {l:"Ester", c:10}] },
    quarta: { nome: "Salmos", livros: [{l:"Salmos", c:150}] },
    quinta: { nome: "Profecia", livros: [{l:"Isaías", c:66}, {l:"Jeremias", c:52}, {l:"Lamentações", c:5}, {l:"Ezequiel", c:48}, {l:"Daniel", c:12}, {l:"Oseias", c:14}, {l:"Joel", c:3}, {l:"Amós", c:9}, {l:"Obadias", c:1}, {l:"Jonas", c:4}, {l:"Miqueias", c:7}, {l:"Naum", c:3}, {l:"Habacuque", c:3}, {l:"Sofonias", c:3}, {l:"Ageu", c:2}, {l:"Zacarias", c:14}, {l:"Malaquias", c:4}, {l:"Apocalipse", c:22}] },
    sexta: { nome: "Evangelhos", livros: [{l:"Mateus", c:28}, {l:"Marcos", c:16}, {l:"Lucas", c:24}, {l:"João", c:21}, {l:"Atos", c:28}] },
    sabado: { nome: "Sabedoria", livros: [{l:"Jó", c:42}, {l:"Provérbios", c:31}, {l:"Eclesiastes", c:12}, {l:"Cânticos", c:8}] }
};

const keys = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

class ReaderApp {
    constructor() {
        this.currentUser = null;
        this.currentReading = null;
        this.currentReferences = [];
        this.fontSize = 1.15; // rem
        this.theme = 'light';
        this.bibleCache = new Map(); // Cache em memória para API
        this.planCache = null;
        this.initCache();
        this.init();
    }

    initCache() {
        const cached = localStorage.getItem('bible_plan_cache');
        if (cached) {
            try {
                this.planCache = JSON.parse(cached);
                console.log('Plano de leitura carregado do cache local.');
            } catch (e) {
                console.error('Erro ao ler cache, recalculando...');
                this.generatePlanCache();
            }
        } else {
            this.generatePlanCache();
        }
    }

    generatePlanCache() {
        console.log('Gerando plano de leitura para o ano inteiro...');
        this.planCache = {};
        for (let w = 1; w <= 52; w++) {
            this.planCache[w] = {};
            keys.forEach(k => {
                this.planCache[w][k] = this.baseCalculateReading(k, w);
            });
        }
        localStorage.setItem('bible_plan_cache', JSON.stringify(this.planCache));
        console.log('Plano gerado e salvo no localStorage.');
    }

    getWeekNumber(d) {
        const start = new Date(d.getFullYear(), 0, 0);
        const diff = d - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        let week = Math.ceil(dayOfYear / 7);
        if (week > 52) week = 52; 
        if (week < 1) week = 1;
        return week;
    }

    calculateReading(diaKey, semanaNum) {
        if (this.planCache && this.planCache[semanaNum] && this.planCache[semanaNum][diaKey]) {
            return this.planCache[semanaNum][diaKey];
        }
        return this.baseCalculateReading(diaKey, semanaNum);
    }

    baseCalculateReading(diaKey, semanaNum) {
        const categoria = DB[diaKey];
        let totalCap = categoria.livros.reduce((acc, l) => acc + l.c, 0);
        const rate = totalCap / 52;
        const start = Math.floor((semanaNum - 1) * rate) + 1;
        const end = Math.floor(semanaNum * rate);
        
        const realEnd = end > totalCap ? totalCap : end;
        const realStart = start > totalCap ? totalCap : start;
        const isFinished = realEnd >= totalCap;

        const result = this.convertCap(categoria.livros, realStart, realEnd);
        
        return {
            text: result.text,
            references: result.references,
            theme: categoria.nome,
            finished: isFinished
        };
    }

    convertCap(livros, inicio, fim) {
        if (inicio > fim) return { text: "Concluído!", references: [] };
        
        let txtIni = "";
        let fullRefs = [];
        let currentGlobalCap = inicio;
        
        // Gera todas as referências (livro + capítulo) para o range
        while(currentGlobalCap <= fim) {
            let accumulatedCaps = 0;
            for (let l of livros) {
                // Verifica se o capítulo global está dentro deste livro
                if (currentGlobalCap > accumulatedCaps && currentGlobalCap <= accumulatedCaps + l.c) {
                    const localChapter = currentGlobalCap - accumulatedCaps;
                    fullRefs.push({ book: l.l, cap: localChapter });
                    break;
                }
                accumulatedCaps += l.c;
            }
            currentGlobalCap++;
        }

        // Encontra o livro e capítulo inicial
        let accumulatedCaps = 0;
        for (let l of livros) {
            if (inicio > accumulatedCaps && inicio <= accumulatedCaps + l.c) {
                let capIni = inicio - accumulatedCaps;
                txtIni = `${l.l} ${capIni}`;
                break;
            }
            accumulatedCaps += l.c;
        }

        // Encontra o livro e capítulo final e monta o texto
        accumulatedCaps = 0;
        for (let l of livros) {
            if (fim > accumulatedCaps && fim <= accumulatedCaps + l.c) {
                let cFim = fim - accumulatedCaps;
                if (txtIni.includes(l.l)) {
                    // Mesmo livro - adiciona range
                    let cIni = parseInt(txtIni.split(" ").pop());
                    if(cIni !== cFim) txtIni += `-${cFim}`;
                } else {
                    // Livros diferentes - adiciona "a Livro cap"
                    txtIni += ` a ${l.l} ${cFim}`;
                }
                break;
            }
            accumulatedCaps += l.c;
        }
        
        return { text: txtIni, references: fullRefs };
    }

    async init() {
        // Auth listener
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfile(user);
                await this.loadTodayReading();
            } else {
                // Redireciona para login
                window.location.href = 'index.html';
            }
        });

        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Font size
        document.getElementById('font-size-btn')?.addEventListener('click', () => {
            this.adjustFontSize();
        });

        // Complete reading
        document.getElementById('complete-reading-btn')?.addEventListener('click', () => {
            this.completeReading();
        });

        // Mobile menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
    }

    updateUserProfile(user) {
        const userName = document.getElementById('user-name');
        const userPlan = document.getElementById('user-plan');
        const userAvatar = document.getElementById('user-avatar');

        if (user.photoURL) {
            userAvatar.style.backgroundImage = `url('${user.photoURL}')`;
            userAvatar.style.backgroundSize = 'cover';
            userAvatar.innerHTML = '';
        }

        if (userName) {
            userName.textContent = user.displayName || user.email || 'Usuário';
        }

        if (userPlan) {
            userPlan.textContent = user.isAnonymous ? 'Visitante' : 'Premium';
        }
    }

    async loadTodayReading() {
        try {
            // Obter leitura do dia atual usando o plano anual
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
            const dayKey = keys[dayOfWeek];
            const weekNumber = this.getWeekNumber(today);
            
            // Calcula a leitura real baseada no plano anual
            const reading = this.calculateReading(dayKey, weekNumber);
            this.currentReferences = reading.references;
            
            // Define a leitura atual
            this.currentReading = {
                text: reading.text,
                theme: reading.theme,
                references: reading.references,
                dayNumber: this.getDayOfYear(today),
                dayKey: dayKey,
                weekNumber: weekNumber,
                finished: reading.finished
            };

            // Atualizar UI
            this.updateHeader();
            await this.loadBibleText();
            await this.loadAIInsights();
        } catch (error) {
            console.error('Erro ao carregar leitura:', error);
            this.showError('Erro ao carregar a leitura do dia');
        }
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    updateHeader() {
        document.getElementById('header-subtitle').textContent = `Dia ${this.currentReading.dayNumber} • Semana ${this.currentReading.weekNumber} • ${this.currentReading.theme}`;
        document.getElementById('header-title').textContent = this.currentReading.text;
        document.getElementById('book-title').textContent = this.currentReading.theme;
        document.getElementById('chapter-title').textContent = this.currentReading.text;
    }

    async loadBibleText() {
        const bibleText = document.getElementById('bible-text');
        bibleText.innerHTML = '<p class="text-center text-stone-400 py-20">Carregando texto bíblico...</p>';

        try {
            // Carrega todos os capítulos da leitura do dia
            const fetchPromises = this.currentReferences.map(async (ref, index) => {
                const text = await this.fetchBibleText(ref.book, ref.cap);
                return { html: text, order: index };
            });
            
            const results = await Promise.all(fetchPromises);
            results.sort((a, b) => a.order - b.order);
            const fullHtml = results.map(r => r.html).join('');
            
            bibleText.innerHTML = this.formatBibleText(fullHtml);
        } catch (error) {
            console.error('Erro ao carregar texto:', error);
            bibleText.innerHTML = '<p class="text-center text-red-400 py-20">Erro ao carregar o texto bíblico</p>';
        }
    }

    async fetchBibleText(book, chapter) {
        // Integração com Bible API usando cache
        const query = `${book} ${chapter}`;
        const cacheKey = `almeida_${query.toLowerCase().replace(/\s+/g, '_')}`;
        
        // 1. Tenta Cache em Memória
        if (this.bibleCache.has(cacheKey)) {
            const data = this.bibleCache.get(cacheKey);
            return this.formatBibleAPIResponse(data, book, chapter);
        }
        
        // 2. Tenta Cache no LocalStorage
        const saved = localStorage.getItem(cacheKey);
        if (saved) {
            const data = JSON.parse(saved);
            this.bibleCache.set(cacheKey, data);
            return this.formatBibleAPIResponse(data, book, chapter);
        }

        try {
            // 3. Busca na API
            const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=almeida&single_chapter_book_matching=indifferent`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // Salvar no cache
            this.bibleCache.set(cacheKey, data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
            
            return this.formatBibleAPIResponse(data, book, chapter);
        } catch (error) {
            console.error(`Erro ao buscar ${query}:`, error);
            return `<div class="mb-8"><h3 class="text-xl font-display font-bold text-primary mb-4">${book} ${chapter}</h3><p class="text-center text-red-400">Erro ao carregar o texto. Verifique sua conexão.</p></div>`;
        }
    }

    formatBibleAPIResponse(data, book, chapter) {
        if (!data) return '';
        
        let html = `<div class="mb-8"><h3 class="text-xl font-display font-bold text-primary mb-4">${book} ${chapter}</h3>`;
        
        // Formatar com verses array (se disponível)
        if (data.verses && data.verses.length > 0) {
            let firstVerse = true;
            html += '<p class="font-reading leading-relaxed">';
            data.verses.forEach(v => {
                if (firstVerse) {
                    html += `<span class="text-6xl float-left mr-3 mt-[-12px] font-bold text-primary font-reading opacity-20">${v.verse}</span>`;
                    html += `<sup class="verse-num">${v.verse}</sup>${v.text} `;
                    firstVerse = false;
                } else {
                    html += `<sup class="verse-num">${v.verse}</sup>${v.text} `;
                }
            });
            html += '</p>';
        } 
        // Fallback: usar texto completo
        else if (data.text) {
            html += `<p class="font-reading leading-relaxed">${data.text.replace(/\n/g, '<br><br>')}</p>`;
        }
        
        html += '</div>';
        return html;
    }

    formatBibleText(text) {
        // Formatação adicional pode ser feita aqui
        return text;
    }

    async loadAIInsights() {
        const insightsContainer = document.getElementById('ai-insights');
        insightsContainer.innerHTML = '<p class="text-sm text-stone-400 text-center py-10">Gerando insights...</p>';

        try {
            if (!window.geminiModel) {
                throw new Error('Modelo AI não disponível');
            }

const prompt = `Você é um pastor evangélico sábio e amoroso. Gere uma reflexão devocional ÚNICA E COMPLETA sobre:

📖 Leitura: ${this.currentReading.text}
📚 Tema: ${this.currentReading.theme}

Estrutura (em um único texto corrido):
1. Abertura acolhedora (1 linha)
2. Contexto bíblico/histórico relevante (2-3 linhas)
3. Ensino teológico principal (3-4 linhas)
4. Aplicação prática para hoje (2-3 linhas)
5. Oração/bênção final (1-2 linhas)

MÁXIMO 150 palavras. Tom: caloroso, profundo, prático. 
Evite clichês. Responda APENAS com o texto da reflexão, sem títulos ou marcadores.`;

            const result = await window.geminiModel.generateContent(prompt);
            const response = await result.response;
            const insights = response.text();

            // Formatar insights
            insightsContainer.innerHTML = this.formatAIInsights(insights);
        } catch (error) {
            console.error('Erro ao gerar insights:', error);
            insightsContainer.innerHTML = this.getDefaultInsights();
        }
    }

    formatAIInsights(text) {
        // Formata o texto em um único card bonito
        const cleanText = text.trim();
        
        // Converte quebras de linha em parágrafos
        const paragraphs = cleanText.split('\n').filter(p => p.trim()).map(p => 
            `<p class="mb-3 last:mb-0">${p.trim()}</p>`
        ).join('');

        return `
            <div class="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div class="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">lightbulb</span> Reflexão do Dia
                    </span>
                </div>
                <div class="text-sm text-stone-600 leading-relaxed font-reading">${paragraphs}</div>
            </div>
        `;
    }

    getDefaultInsights() {
        return `
            <div class="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div class="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">lightbulb</span> Reflexão do Dia
                    </span>
                </div>
                <div class="text-sm text-stone-600 leading-relaxed font-reading">
                    <p class="mb-3">Que alegria estar aqui com você neste momento de comunhão com a Palavra! A leitura de hoje nos convida a mergulhar nas profundezas da sabedoria divina.</p>
                    <p class="mb-3">Cada passagem das Escrituras foi cuidadosamente preservada para nos ensinar, corrigir e guiar. Ao lermos hoje, lembremos que o próprio Espírito Santo está conosco, iluminando nosso entendimento.</p>
                    <p>Que o Senhor abra nossos corações para receber Sua verdade e nos transforme à imagem de Cristo. Amém.</p>
                </div>
            </div>
        `;
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
        
        if (currentTheme === 'light') {
            html.classList.add('dark');
            this.theme = 'dark';
        } else {
            html.classList.remove('dark');
            this.theme = 'light';
        }

        // Salvar preferência
        localStorage.setItem('theme', this.theme);
    }

    adjustFontSize() {
        this.fontSize = this.fontSize >= 1.5 ? 1.0 : this.fontSize + 0.15;
        const readingText = document.querySelector('.reading-text');
        if (readingText) {
            readingText.style.fontSize = `${this.fontSize}rem`;
        }
        localStorage.setItem('fontSize', this.fontSize);
    }

    async completeReading() {
        if (!this.currentUser) {
            console.error('Usuário não autenticado');
            this.showError('Você precisa estar logado para marcar como lido');
            return;
        }

        try {
            // VALIDAÇÃO DEFENSIVA
            const userId = this.currentUser.uid;
            const today = new Date().toISOString().split('T')[0];
            
            // Verificar se valores são válidos
            if (!userId || typeof userId !== 'string' || userId.includes('/')) {
                throw new Error(`userId inválido: "${userId}"`);
            }
            if (!today || typeof today !== 'string' || today.includes('/')) {
                throw new Error(`readingId inválido: "${today}"`);
            }
            
            // LOGGING DETALHADO PARA DEBUG
            console.group('🔍 DEBUG: completeReading()');
            console.log('✅ auth.currentUser.uid:', userId);
            console.log('✅ readingId (today):', today);
            console.log('📍 Path completo:', `users/${userId}/progress/${today}`);
            console.log('� Tipo de auth:', this.currentUser.isAnonymous ? 'ANÔNIMA' : 'GOOGLE');
            console.log('📧 Email:', this.currentUser.email || 'N/A');
            console.log('📦 Dados:', {
                read: true,
                completed: true,
                reading: this.currentReading.text,
                theme: this.currentReading.theme,
                weekNumber: this.currentReading.weekNumber
            });
            
            // Testar token JWT
            try {
                const token = await this.currentUser.getIdToken();
                console.log('🎫 Token JWT obtido:', token.substring(0, 50) + '...');
            } catch (tokenError) {
                console.error('❌ Erro ao obter token:', tokenError);
            }
            
            console.groupEnd();
            
            // OPERAÇÃO FIREBASE
            const docRef = db.collection('users')
                .doc(userId)
                .collection('progress')
                .doc(today);
            
            console.log('🔥 Executando setDoc()...');
            console.log('📌 DocRef path:', docRef.path);
            console.log('📌 DocRef id:', docRef.id);
            console.log('📌 Firestore project:', db.app.options.projectId);
            
            await docRef.set({
                read: true,
                completed: true,
                reading: this.currentReading.text,
                theme: this.currentReading.theme,
                weekNumber: this.currentReading.weekNumber,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Feedback visual
            const btn = document.getElementById('complete-reading-btn');
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Concluído!';
            btn.classList.add('bg-green-600');
            btn.disabled = true;
            
            this.showSuccess('Leitura marcada como concluída! 🎉');
            
            console.log('✅ Progresso salvo com sucesso!');
            
            setTimeout(() => {
                btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Marcar como Lido';
                btn.classList.remove('bg-green-600');
                btn.disabled = false;
            }, 3000);
        } catch (error) {
            console.error('Erro ao marcar leitura:', error);
            this.showError('Erro ao salvar progresso: ' + error.message);
        }
    }

    downloadReadingPDF() {
        const element = document.getElementById('bible-text');
        const opt = {
            margin:       10,
            filename:     `Leitura_${this.currentReading.text.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }

    copyReading() {
        const text = document.getElementById('bible-text').innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('Texto copiado para a área de transferência!');
        });
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.toggle('translate-x-0');
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        } else {
            console.warn('Sidebar não encontrado - funcionalidade mobile não disponível nesta página');
        }
    }

    async logout() {
        if (confirm('Deseja realmente sair?')) {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao sair. Tente novamente.');
            }
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-display`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-xl">${type === 'success' ? 'check_circle' : 'error'}</span>
            <span class="text-sm font-medium">${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slide-out 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        console.error(message);
        this.showToast(message, 'error');
    }
}

// Inicializa o app
const app = new ReaderApp();
