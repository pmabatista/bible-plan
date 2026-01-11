// ==============================================
// CONFIGURAÇÃO DO FIREBASE
// ==============================================
// IMPORTANTE: Substitua com suas credenciais do Firebase Console
// 1. Acesse https://console.firebase.google.com/
// 2. Crie um projeto
// 3. Adicione um app Web
// 4. Ative Firestore Database e Authentication (Anonymous)
// 5. Cole suas credenciais abaixo:

const firebaseConfig = {
  apiKey: "AIzaSyB7uLzC11ekDHjx9Gw14Cx2R4h9I8hyGJ4",
  authDomain: "bible-plan-95825.firebaseapp.com",
  projectId: "bible-plan-95825",
  storageBucket: "bible-plan-95825.firebasestorage.app",
  messagingSenderId: "788106777338",
  appId: "1:788106777338:web:9f19d40a7f45e6ec9f6f43",
  measurementId: "G-DTSQ5TXN50"
};


// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Inicializa Firebase AI (Gemini)
let ai = null;
let geminiModel = null;
try {
    ai = firebase.ai();
    geminiModel = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('✅ Firebase AI inicializado com sucesso!');
} catch (e) {
    console.warn('⚠️ Firebase AI não disponível. Ative no Console do Firebase.');
}

// ==============================================
// DADOS BÍBLICOS
// ==============================================
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
const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ==============================================
// CLASSE PRINCIPAL
// ==============================================
class BibleApp {
    constructor() {
        this.currentDate = new Date();
        this.activeTab = 'daily';
        this.currentReferences = [];
        this.currentReadingText = "";
        this.userId = null;
        this.readDays = new Set();
        this.planCache = null;
        this.bibleCache = new Map();
        this.readerFontSize = 1.15; // rem
        this.readerTheme = 'light'; // light, sepia, dark
        this.notesCache = new Map(); // Cache de notas por data
        this.notesSaveTimeout = null; // Debounce para auto-save
        this.notesModified = false;
        this.reflectionCache = new Map(); // Cache de reflexões por data
        this.init();
    }

    async init() {
        this.initCache();
        
        // Verifica se já está logado
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.userId = user.uid;
                this.currentUser = user;
                this.hideLoginModal();
                this.showAuthStatus('success', user.isAnonymous ? '✓ Modo Anônimo' : '✓ Logado');
                await this.loadProgress();
                this.updateUserProfile();
                this.renderAll();
            } else {
                this.showLoginModal();
            }
        });

        document.getElementById('dateInput').valueAsDate = this.currentDate;
        
        // Fecha profile ao clicar fora
        document.addEventListener('click', (e) => {
            const profileModal = document.getElementById('profile-modal');
            const userStats = document.querySelector('.user-stats');
            if (profileModal.classList.contains('open') && 
                !profileModal.contains(e.target) && 
                !userStats.contains(e.target)) {
                this.toggleProfile();
            }
        });
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

    formatDateLong(date) {
        return `${date.getDate()} de ${monthNames[date.getMonth()]}, ${date.getFullYear()}`;
    }

    formatDateShort(date) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${d}/${m}/${y}`;
    }

    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('login-modal').classList.add('hidden');
    }

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
            // onAuthStateChanged vai pegar automaticamente
        } catch (error) {
            console.error('Erro no login Google:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert('Erro ao fazer login com Google. Tente novamente.');
            }
        }
    }

    async continueAnonymously() {
        try {
            await auth.signInAnonymously();
            // onAuthStateChanged vai pegar automaticamente
        } catch (error) {
            console.error('Erro no login anônimo:', error);
            alert('Erro ao continuar. Tente novamente.');
        }
    }

    async logout() {
        try {
            // Efeito de fade out suave
            document.body.classList.add('logging-out');
            
            setTimeout(async () => {
                await auth.signOut();
                this.toggleProfile(); // Fecha o modal
                this.readDays.clear();
                
                // Limpa states e volta ao início
                this.userId = null;
                this.currentUser = null;
                
                // Remove classe e o onAuthStateChanged cuidará de mostrar o login
                document.body.classList.remove('logging-out');
                this.renderAll();
            }, 300);
            
        } catch (error) {
            console.error('Erro ao sair:', error);
            document.body.classList.remove('logging-out');
        }
    }

    toggleProfile() {
        const modal = document.getElementById('profile-modal');
        modal.classList.toggle('open');
    }

    updateUserProfile() {
        const isAnonymous = this.currentUser?.isAnonymous;
        const userName = isAnonymous ? 'Visitante' : (this.currentUser?.displayName || 'Usuário');
        const photoURL = this.currentUser?.photoURL;
        
        // Header stats
        document.getElementById('user-name').innerText = userName;
        document.getElementById('user-progress').innerText = `${this.readDays.size} dias lidos`;
        
        // Update Avatars
        const avatarEl = document.querySelector('.user-avatar');
        const profileAvatarEl = document.querySelector('.profile-avatar-large');
        
        if (photoURL) {
            avatarEl.innerHTML = `<img src="${photoURL}" alt="${userName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            profileAvatarEl.innerHTML = `<img src="${photoURL}" alt="${userName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        } else {
            avatarEl.innerText = '👤';
            profileAvatarEl.innerText = '👤';
        }
        
        // Profile modal
        document.getElementById('profile-name').innerText = userName;
        document.getElementById('profile-type').innerText = isAnonymous ? '👤 Modo Anônimo' : '✓ Conectado com Google';
        
        // Calcular estatísticas
        const totalDaysRead = this.readDays.size;
        const percentYear = Math.round((totalDaysRead / 365) * 100);
        
        // Dias lidos esta semana
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        let thisWeekCount = 0;
        
        this.readDays.forEach(dateStr => {
            const date = new Date(dateStr);
            if (date >= startOfWeek) thisWeekCount++;
        });
        
        // Calcular sequência (streak)
        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        
        while (this.readDays.has(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        // Atualizar stats
        document.getElementById('stat-total').innerText = totalDaysRead;
        document.getElementById('stat-percent').innerText = `${percentYear}%`;
        document.getElementById('stat-week').innerText = thisWeekCount;
        document.getElementById('stat-streak').innerText = streak;
    }

    showAuthStatus(status, message) {
        const statusEl = document.getElementById('auth-status');
        if (!statusEl) return;
        statusEl.style.display = 'flex';
        statusEl.className = `auth-status ${status}`;
        statusEl.innerText = message;
    }

    // ==============================================
    // FIREBASE - PROGRESSO
    // ==============================================
    async loadProgress() {
        if (!this.userId) return;
        
        try {
            const docRef = db.collection('users').doc(this.userId).collection('progress');
            const snapshot = await docRef.get();
            
            this.readDays.clear();
            snapshot.forEach(doc => {
                if (doc.data().read) {
                    this.readDays.add(doc.id);
                }
            });
            
            this.renderAll();
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        }
    }

    async markDayAsRead(dateStr, isRead) {
        if (!this.userId) return;
        
        try {
            const docRef = db.collection('users').doc(this.userId).collection('progress').doc(dateStr);
            
            await docRef.set({
                read: isRead,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            if (isRead) {
                this.readDays.add(dateStr);
            } else {
                this.readDays.delete(dateStr);
            }
            
            this.renderAll();
        } catch (error) {
            console.error('Erro ao salvar progresso:', error);
            alert('Erro ao salvar. Tente novamente.');
        }
    }

    isDateRead(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.readDays.has(dateStr);
    }

    // ==============================================
    // NAVEGAÇÃO
    // ==============================================
    updateDate() {
        const input = document.getElementById('dateInput');
        this.currentDate = new Date(input.value + "T12:00:00"); 
        this.renderAll();
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`button[onclick="app.switchTab('${tabName}')"]`).classList.add('active');
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`view-${tabName}`).classList.add('active');

        const fabText = document.getElementById('fab-text');
        if (tabName === 'daily') fabText.innerText = "📸 Imagem do Dia";
        else if (tabName === 'weekly') fabText.innerText = "📸 Imagem da Semana";
        else if (tabName === 'monthly') fabText.innerText = "📸 Imagem do Mês";
        else fabText.innerText = "📸 Compartilhar";
    }

    // ==============================================
    // ALGORITMOS
    // ==============================================
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
        
        let count = 0; 
        let txtIni = "";
        let fullRefs = [];
        let currentGlobalCap = inicio;
        
        while(currentGlobalCap <= fim) {
            let localCount = 0;
            for (let l of livros) {
                if (currentGlobalCap <= localCount + l.c) {
                    fullRefs.push({ book: l.l, cap: currentGlobalCap - localCount });
                    break;
                }
                localCount += l.c;
            }
            currentGlobalCap++;
        }

        count = 0;
        for (let l of livros) {
            if (inicio <= count + l.c) {
                let capIni = inicio - count;
                txtIni = `${l.l} ${capIni}`;
                break;
            }
            count += l.c;
        }

        count = 0;
        for (let l of livros) {
            if (fim <= count + l.c) {
                let cFim = fim - count;
                if (txtIni.includes(l.l)) {
                    let cIni = parseInt(txtIni.split(" ").pop());
                    if(cIni !== cFim) txtIni += `-${cFim}`;
                } else {
                    txtIni += ` a ${l.l} ${cFim}`;
                }
                break;
            }
            count += l.c;
        }
        return { text: txtIni, references: fullRefs };
    }

    // ==============================================
    // API BÍBLIA - HELPER COM CACHE E SEGURANÇA
    // ==============================================
    async fetchFromBibleAPI(book, cap) {
        const query = `${book} ${cap}`;
        const cacheKey = `almeida_${query.toLowerCase().replace(/\s+/g, '_')}`;
        
        // 1. Tenta Cache em Memória
        if (this.bibleCache.has(cacheKey)) return this.bibleCache.get(cacheKey);
        
        // 2. Tenta Cache no LocalStorage (persistente entre reloads)
        const saved = localStorage.getItem(cacheKey);
        if (saved) {
            const data = JSON.parse(saved);
            this.bibleCache.set(cacheKey, data);
            return data;
        }

        try {
            // Documentação sugere single_chapter_book_matching=indifferent para evitar erro em Jude 1, etc.
            const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=almeida&single_chapter_book_matching=indifferent`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // Salvar no cache (Memória e LocalStorage)
            this.bibleCache.set(cacheKey, data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
            
            return data;
        } catch (error) {
            console.error(`Erro ao buscar ${query}:`, error);
            return null;
        }
    }

    async fetchReadingTime(references) {
        const badge = document.getElementById('reading-timer');
        const icon = document.getElementById('timer-icon');
        const text = document.getElementById('timer-text');
        badge.classList.add('visible');
        icon.classList.add('spinner');
        text.innerText = "Calculando...";
        let totalWords = 0;
        const promises = references.map(async (ref) => {
            const json = await this.fetchFromBibleAPI(ref.book, ref.cap);
            if (json && json.text) {
                return json.text.split(/\s+/).length;
            }
            return 250; // Fallback médio por capítulo
        });
        const results = await Promise.all(promises);
        totalWords = results.reduce((a, b) => a + b, 0);
        if (totalWords === 0 && references.length > 0) totalWords = references.length * 250;
        const minutes = Math.ceil(totalWords / 150);
        icon.classList.remove('spinner');
        icon.innerHTML = "⏱️";
        text.innerText = `Tempo estimado: ~${minutes} min`;
        document.getElementById('share-time-display').innerText = `⏱️ ${minutes} min`;
    }

    // ==============================================
    // RENDERIZADORES
    // ==============================================
    renderAll() {
        this.renderDaily();
        this.renderWeekly();
        this.renderMonthly();
        this.renderYearly();
        this.updateUserProfile();
    }

    async renderDaily() {
        const week = this.getWeekNumber(this.currentDate);
        const dayIdx = this.currentDate.getDay();
        const data = this.calculateReading(keys[dayIdx], week);
        
        this.currentReferences = data.references;
        this.currentReadingText = "";

        document.getElementById('daily-theme').innerText = data.theme;
        let finishedHtml = data.finished ? '<span class="finish-badge">🏁 LIVRO CONCLUÍDO</span>' : '';
        document.getElementById('daily-reading').innerHTML = data.text + finishedHtml;
        document.getElementById('daily-context').innerHTML = `<strong>${this.formatDateLong(this.currentDate)}</strong><br>Hoje é ${names[dayIdx]}, dia de focar em ${data.theme}. Você está na Semana ${week}.`;
        
        document.getElementById('share-date').innerText = this.currentDate.toLocaleDateString('pt-BR');
        document.getElementById('share-theme').innerText = data.theme;
        document.getElementById('share-reading').innerText = data.text;
        document.getElementById('share-week').innerText = `Semana ${week}`;
        
        document.getElementById('reader-title').innerText = `${data.theme}: ${data.text}`;

        // Atualiza botão de marcar como lido
        const isRead = this.isDateRead(this.currentDate);
        const markBtn = document.getElementById('mark-read-btn');
        markBtn.className = `btn-mark-read ${isRead ? 'completed' : ''}`;
        markBtn.innerText = isRead ? '✓ Lido' : '✓ Marcar como Lido';

        await this.fetchReadingTime(data.references);
        await this.updateNotesUI();
        await this.loadReflectionForDate();
    }

    renderWeekly() {
        const d = new Date(this.currentDate);
        const day = d.getDay(); 
        const diff = d.getDate() - day; 
        const sunday = new Date(d);
        sunday.setDate(diff);
        document.getElementById('week-title').innerText = `Semana de ${sunday.toLocaleDateString('pt-BR').substring(0,5)}`;

        let html = "";
        for (let i = 0; i < 7; i++) {
            const currentDayDate = new Date(sunday);
            currentDayDate.setDate(sunday.getDate() + i);
            const w = this.getWeekNumber(currentDayDate);
            const k = keys[i];
            const dReading = this.calculateReading(k, w);
            const isToday = i === this.currentDate.getDay();
            const isRead = this.isDateRead(currentDayDate);
            const bg = isToday ? "background:#EFF6FF;" : "";
            const completedClass = isRead ? 'completed' : '';
            const finishedBadge = dReading.finished ? '<span style="color:#10B981; margin-left:5px;">🏁</span>' : '';
            const metaTag = `<span class="list-meta">Meta ${w}</span>`;
            const dateStr = currentDayDate.toISOString().split('T')[0];
            const dateDisplay = this.formatDateShort(currentDayDate);

            html += `<div class="list-item ${completedClass}" style="${bg}">
                <input type="checkbox" ${isRead ? 'checked' : ''} onchange="app.toggleDayRead('${dateStr}', this.checked)">
                <div class="list-day">${names[i]}<br><span style="font-size:0.7rem; font-weight:normal; color:#9CA3AF;">${dateDisplay}</span></div>
                <div class="list-content">
                    <span class="list-theme">${dReading.theme} ${metaTag}</span>
                    ${dReading.text} ${finishedBadge}
                </div>
            </div>`;
        }
        document.getElementById('weekly-list').innerHTML = html;
    }

    toggleDayRead(dateStr, isChecked) {
        this.markDayAsRead(dateStr, isChecked);
    }

    renderMonthly() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        document.getElementById('month-title').innerText = `Visão Geral: ${monthNames[month]} ${year}`;
        let html = "";
        
        let firstDayOfMonth = new Date(year, month, 1);
        let startDay = new Date(firstDayOfMonth);
        startDay.setDate(1 - firstDayOfMonth.getDay()); 
        
        let current = new Date(startDay);
        let lastWeekGenerated = -1;
        
        while (true) {
             if (current.getMonth() > month && current.getFullYear() === year && current.getDay() === 0) break;
             if (current.getFullYear() > year) break;

             const w = this.getWeekNumber(current);
             if (w !== lastWeekGenerated) {
                 html += `<div style="margin-top:15px; font-weight:bold; color:var(--primary); border-bottom: 2px solid #E5E7EB; padding-bottom: 5px;">Semana ${w}</div>`;
                 lastWeekGenerated = w;
             }
             
             const k = keys[current.getDay()];
             const dReading = this.calculateReading(k, w);
             const isToday = current.toDateString() === this.currentDate.toDateString();
             const isRead = this.isDateRead(current);
             const bg = isToday ? "background:#EFF6FF; border-left: 4px solid var(--primary); padding-left: 10px;" : "";
             const textStyle = isRead ? "text-decoration: line-through; opacity: 0.6;" : "";
             
             html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px dashed #eee; ${bg}">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.75rem; color:#9CA3AF; width:45px;">${this.formatDateShort(current).substring(0,5)}</span>
                    <span style="font-size:0.85rem; font-weight:600; width:35px;">${names[current.getDay()].substring(0,3)}</span>
                    <span style="font-size:0.9rem; ${textStyle}">${dReading.text}</span>
                </div>
                <span style="font-size:0.7rem; color:var(--text-sec); background:#F3F4F6; padding:2px 6px; border-radius:4px;">${dReading.theme.substring(0,3)}</span>
             </div>`;
             
             current.setDate(current.getDate() + 1);
        }

        document.getElementById('monthly-list').innerHTML = html || "Sem dados para este mês.";
    }

    renderYearly() {
        const year = this.currentDate.getFullYear();
        let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 15px; padding: 5px;">`;
        
        monthNames.forEach((name, i) => {
            const firstDay = new Date(year, i, 1);
            const lastDay = new Date(year, i + 1, 0);
            const wStart = this.getWeekNumber(firstDay);
            const wEnd = this.getWeekNumber(lastDay);
            
            // Calcular progresso do mês
            const daysInMonth = lastDay.getDate();
            let readCount = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                const checkDate = new Date(year, i, d);
                if (this.isDateRead(checkDate)) readCount++;
            }
            const percent = Math.round((readCount / daysInMonth) * 100);
            
            html += `<div style="padding:20px; background:white; border:1px solid #E5E7EB; border-radius:16px; text-align:center; transition: transform 0.2s; cursor:pointer;" onclick="app.jumpToMonth(${i})">
                <div style="font-size:1.1rem; font-weight:800; color:var(--primary); margin-bottom:8px;">${name}</div>
                <div style="font-size:0.75rem; color:var(--text-sec); margin-bottom:12px;">Meta: Semanas ${wStart} - ${wEnd}</div>
                <div style="height:6px; background:#F3F4F6; border-radius:3px; overflow:hidden; position:relative; margin-bottom:5px;">
                    <div style="width:${percent}%; height:100%; background:var(--success); transition: width 0.3s;"></div>
                </div>
                <div style="font-size:0.7rem; font-weight:700; color:var(--success);">${percent}% concluído</div>
            </div>`;
        });
        
        html += `</div>`;
        document.getElementById('yearly-list').innerHTML = html;
    }

    jumpToMonth(m) {
        this.currentDate.setMonth(m);
        document.getElementById('dateInput').valueAsDate = this.currentDate;
        this.switchTab('monthly');
        this.renderAll();
    }

    // ==============================================
    // MODAL LEITOR
    // ==============================================
    async openReader() {
        const modal = document.getElementById('reader-modal');
        const content = document.getElementById('reader-content');
        
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; 

        if (this.currentReadingText && content.innerHTML.length > 500) return;

        content.innerHTML = `<div style="text-align:center; margin-top:50px;"><span class="spinner" style="font-size:2rem;">⏳</span><p>Baixando texto bíblico...</p></div>`;

        // CARREGA TODOS OS CAPÍTULOS USANDO O HELPER COM CACHE
        const fetchPromises = this.currentReferences.map(async (ref, index) => {
            const json = await this.fetchFromBibleAPI(ref.book, ref.cap);
            
            let html = `<h3>${ref.book} ${ref.cap}</h3>`;
            
            if (json && json.verses && json.verses.length > 0) {
                let chapterText = "";
                json.verses.forEach(v => {
                    chapterText += `<span class="verse-num">${v.verse}</span>${v.text} `;
                });
                html += `<p>${chapterText}</p>`;
            } else if (json && json.text) {
                const text = json.text.replace(/\n/g, '<br><br>');
                html += `<p>${text}</p>`;
            } else {
                html += `<p style="color:red">Não foi possível carregar o texto de ${ref.book} ${ref.cap}. Verifique sua conexão.</p>`;
            }
            
            return { html, order: index };
        });
        
        // Aguarda TODAS as requisições (muitas virão do cache instantaneamente)
        const results = await Promise.all(fetchPromises);
        
        // Ordena e monta o HTML
        results.sort((a, b) => a.order - b.order);
        const fullHtml = results.map(r => r.html).join('');

        content.innerHTML = fullHtml;
        this.currentReadingText = fullHtml; 
    }

    closeReader() {
        document.getElementById('reader-modal').classList.remove('open');
        document.body.style.overflow = 'auto';
    }

    // ==============================================
    // SISTEMA DE ANOTAÇÕES
    // ==============================================
    async loadNotes(dateStr) {
        if (!this.userId) return '';
        
        // Tenta cache primeiro
        if (this.notesCache.has(dateStr)) {
            return this.notesCache.get(dateStr);
        }
        
        try {
            const docRef = db.collection('users').doc(this.userId).collection('notes').doc(dateStr);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const noteText = doc.data().text || '';
                this.notesCache.set(dateStr, noteText);
                return noteText;
            }
            return '';
        } catch (error) {
            console.error('Erro ao carregar anotações:', error);
            return '';
        }
    }

    async saveNotes() {
        if (!this.userId) {
            this.showNotesStatus('⚠️ Faça login para salvar', 'warning');
            return;
        }
        
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const textarea = document.getElementById('daily-notes');
        const noteText = textarea.value.trim();
        
        this.showNotesStatus('💾 Salvando...', 'saving');
        
        try {
            const docRef = db.collection('users').doc(this.userId).collection('notes').doc(dateStr);
            
            if (noteText) {
                await docRef.set({
                    text: noteText,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    date: dateStr
                });
                this.notesCache.set(dateStr, noteText);
            } else {
                // Se vazio, remove a nota
                await docRef.delete();
                this.notesCache.delete(dateStr);
            }
            
            this.notesModified = false;
            this.showNotesStatus('✓ Salvo', 'saved');
            
            // Limpa o status após 2 segundos
            setTimeout(() => this.showNotesStatus('', ''), 2000);
            
        } catch (error) {
            console.error('Erro ao salvar anotações:', error);
            this.showNotesStatus('❌ Erro ao salvar', 'error');
        }
    }

    onNotesInput() {
        this.notesModified = true;
        this.showNotesStatus('● Não salvo', 'unsaved');
        
        // Auto-save com debounce de 3 segundos
        if (this.notesSaveTimeout) {
            clearTimeout(this.notesSaveTimeout);
        }
        
        this.notesSaveTimeout = setTimeout(() => {
            if (this.notesModified) {
                this.saveNotes();
            }
        }, 3000);
    }

    showNotesStatus(message, type) {
        const statusEl = document.getElementById('notes-status');
        if (!statusEl) return;
        
        statusEl.innerText = message;
        statusEl.className = `notes-status ${type}`;
    }

    async updateNotesUI() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const textarea = document.getElementById('daily-notes');
        const dateLabel = document.getElementById('notes-date');
        
        if (!textarea) return;
        
        // Atualiza label da data
        dateLabel.innerText = this.formatDateLong(this.currentDate);
        
        // Carrega notas existentes
        const existingNotes = await this.loadNotes(dateStr);
        textarea.value = existingNotes;
        this.notesModified = false;
        
        // Atualiza status
        if (existingNotes) {
            this.showNotesStatus('', '');
        } else {
            this.showNotesStatus('', '');
        }
    }

    // ==============================================
    // REFLEXÃO COM IA (Firebase AI / Gemini)
    // ==============================================
    async generateReflection(forceNew = false) {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const contentEl = document.getElementById('reflection-content');
        const metaEl = document.getElementById('reflection-meta');
        const refreshBtn = document.getElementById('refresh-reflection-btn');
        
        // Verifica se o Firebase AI está disponível
        if (!geminiModel) {
            contentEl.innerHTML = `
                <div class="reflection-error">
                    <span>⚠️</span>
                    <p>Firebase AI não está configurado.</p>
                    <small>Ative o "AI Logic" no Console do Firebase e recarregue a página.</small>
                </div>
            `;
            return;
        }

        // Tenta cache primeiro (se não for forçar nova)
        if (!forceNew) {
            // Cache em memória
            if (this.reflectionCache.has(dateStr)) {
                this.displayReflection(this.reflectionCache.get(dateStr));
                return;
            }
            
            // Cache no Firestore
            if (this.userId) {
                try {
                    const docRef = db.collection('users').doc(this.userId).collection('reflections').doc(dateStr);
                    const doc = await docRef.get();
                    if (doc.exists) {
                        const data = doc.data();
                        this.reflectionCache.set(dateStr, data);
                        this.displayReflection(data);
                        return;
                    }
                } catch (e) {
                    console.warn('Erro ao buscar reflexão do cache:', e);
                }
            }
        }

        // Mostra loading
        refreshBtn.classList.add('spinning');
        contentEl.innerHTML = `
            <div class="reflection-loading">
                <span class="spinner">✨</span>
                <p>Gerando reflexão personalizada...</p>
            </div>
        `;

        try {
            // Pega dados da leitura atual
            const week = this.getWeekNumber(this.currentDate);
            const dayIdx = this.currentDate.getDay();
            const reading = this.calculateReading(keys[dayIdx], week);
            
            const prompt = `Você é um pastor evangélico amoroso e sábio. 
Gere uma reflexão devocional CURTA (máximo 120 palavras) sobre a leitura bíblica do dia.

📖 Leitura: ${reading.text}
📚 Tema: ${reading.theme}
📅 Data: ${this.formatDateLong(this.currentDate)}

Estrutura:
1. Uma frase de abertura conectando o tema ao dia (1 linha)
2. Um insight prático sobre a passagem (2-3 linhas)  
3. Uma aplicação para a vida cotidiana (1-2 linhas)
4. Uma breve oração de encerramento (2 linhas)

Tom: Acolhedor, esperançoso, prático. Evite clichês religiosos.
Responda APENAS com a reflexão, sem títulos ou formatação markdown.`;

            const result = await geminiModel.generateContent(prompt);
            const text = result.response.text();
            
            const reflectionData = {
                text: text,
                reading: reading.text,
                theme: reading.theme,
                generatedAt: new Date().toISOString()
            };

            // Salva no cache
            this.reflectionCache.set(dateStr, reflectionData);
            
            // Salva no Firestore (se logado)
            if (this.userId) {
                try {
                    await db.collection('users').doc(this.userId).collection('reflections').doc(dateStr).set(reflectionData);
                } catch (e) {
                    console.warn('Erro ao salvar reflexão:', e);
                }
            }

            this.displayReflection(reflectionData);

        } catch (error) {
            console.error('Erro ao gerar reflexão:', error);
            contentEl.innerHTML = `
                <div class="reflection-error">
                    <span>❌</span>
                    <p>Erro ao gerar reflexão.</p>
                    <small>${error.message || 'Tente novamente mais tarde.'}</small>
                    <button class="btn-generate" onclick="app.generateReflection(true)" style="margin-top:10px;">
                        🔄 Tentar Novamente
                    </button>
                </div>
            `;
        } finally {
            refreshBtn.classList.remove('spinning');
        }
    }

    displayReflection(data) {
        const contentEl = document.getElementById('reflection-content');
        const metaEl = document.getElementById('reflection-meta');
        const timeEl = document.getElementById('reflection-time');
        
        // Formata o texto com parágrafos
        const formattedText = data.text
            .split('\n')
            .filter(p => p.trim())
            .map(p => `<p>${p}</p>`)
            .join('');

        contentEl.innerHTML = `<div class="reflection-text">${formattedText}</div>`;
        
        // Mostra meta info
        metaEl.style.display = 'flex';
        const generatedDate = new Date(data.generatedAt);
        timeEl.innerText = `${generatedDate.toLocaleDateString('pt-BR')} ${generatedDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`;
    }

    async loadReflectionForDate() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const contentEl = document.getElementById('reflection-content');
        const metaEl = document.getElementById('reflection-meta');
        
        // Reset UI
        metaEl.style.display = 'none';
        
        // Verifica cache
        if (this.reflectionCache.has(dateStr)) {
            this.displayReflection(this.reflectionCache.get(dateStr));
            return;
        }

        // Verifica Firestore
        if (this.userId) {
            try {
                const docRef = db.collection('users').doc(this.userId).collection('reflections').doc(dateStr);
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    this.reflectionCache.set(dateStr, data);
                    this.displayReflection(data);
                    return;
                }
            } catch (e) {
                console.warn('Erro ao buscar reflexão:', e);
            }
        }

        // Nenhuma reflexão encontrada - mostra placeholder
        contentEl.innerHTML = `
            <div class="reflection-placeholder">
                <span class="reflection-icon">💭</span>
                <p>Clique para gerar uma reflexão personalizada sobre a leitura de hoje.</p>
                <button class="btn-generate" onclick="app.generateReflection()">
                    ✨ Gerar Reflexão com IA
                </button>
            </div>
        `;
    }

    adjustFontSize(delta) {
        this.readerFontSize += delta * 0.1;
        if (this.readerFontSize < 0.8) this.readerFontSize = 0.8;
        if (this.readerFontSize > 2.0) this.readerFontSize = 2.0;
        document.getElementById('reader-content').style.fontSize = `${this.readerFontSize}rem`;
    }

    toggleReaderTheme() {
        const modal = document.getElementById('reader-modal');
        const btn = document.getElementById('reader-theme-btn');
        
        modal.classList.remove('theme-sepia', 'theme-dark');
        
        if (this.readerTheme === 'light') {
            this.readerTheme = 'sepia';
            modal.classList.add('theme-sepia');
            btn.innerText = '📜';
        } else if (this.readerTheme === 'sepia') {
            this.readerTheme = 'dark';
            modal.classList.add('theme-dark');
            btn.innerText = '🌙';
        } else {
            this.readerTheme = 'light';
            btn.innerText = '☀️';
        }
    }

    async markTodayAsRead() {
        const dateStr = this.currentDate.toISOString().split('T')[0];
        const isCurrentlyRead = this.isDateRead(this.currentDate);
        await this.markDayAsRead(dateStr, !isCurrentlyRead);
    }

    downloadReadingPDF() {
        const element = document.getElementById('reader-content');
        const opt = {
            margin:       10,
            filename:     `Leitura_${this.currentDate.toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }

    copyReading() {
        const text = document.getElementById('reader-content').innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert("Texto copiado para a área de transferência!");
        });
    }

    // ==============================================
    // GERADOR DE IMAGENS
    // ==============================================
    async handleFabClick() {
        const btn = document.querySelector('#fab-btn');
        const originalText = document.getElementById('fab-text').innerText;
        document.getElementById('fab-text').innerText = "⏳ Gerando...";
        
        try {
            let elementToCapture;
            if (this.activeTab === 'daily') elementToCapture = document.getElementById('share-node');
            else {
                this.renderShareList(this.activeTab);
                elementToCapture = document.getElementById('share-list-node');
            }

            const canvas = await html2canvas(elementToCapture, { scale: 2, backgroundColor: null });
            const link = document.createElement('a');
            let suffix = this.activeTab === 'daily' ? 'Dia' : 'Lista';
            link.download = `LeituraBiblica_${suffix}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            document.getElementById('fab-text').innerText = "✅ Sucesso!";
        } catch (err) {
            alert("Erro ao gerar imagem.");
        } finally {
            setTimeout(() => document.getElementById('fab-text').innerText = originalText, 2000);
        }
    }

    renderShareList(type) {
        const container = document.getElementById('sl-body');
        const subTitle = document.getElementById('sl-subtitle');
        container.innerHTML = "";

        if (type === 'weekly') {
            const d = new Date(this.currentDate);
            const day = d.getDay(); 
            const diff = d.getDate() - day; 
            const sunday = new Date(d);
            sunday.setDate(diff);
            const currentDayIndex = this.currentDate.getDay();
            
            subTitle.innerText = `Visão Geral: Semana de ${sunday.toLocaleDateString('pt-BR').substring(0,5)}`;
            let html = `<div class="sl-week-group"><div class="sl-week-title">Próximos Dias</div>`;
            
            for (let i = currentDayIndex; i <= 6; i++) {
                const currentDayDate = new Date(sunday);
                currentDayDate.setDate(sunday.getDate() + i);
                const w = this.getWeekNumber(currentDayDate); 
                const k = keys[i];
                const dReading = this.calculateReading(k, w);
                
                html += `<div class="sl-item">
                    <div class="sl-day">${names[i].substring(0,3)}<br><small style="font-size:0.8rem; font-weight:normal; color:#9CA3AF;">${this.formatDateShort(currentDayDate).substring(0,5)}</small></div>
                    <div class="sl-content">
                        <span class="sl-theme">${dReading.theme} (Meta ${w})</span>
                        <div class="sl-reading">${dReading.text}</div>
                    </div>
                </div>`;
            }
            html += `</div>`;
            container.innerHTML = html;
        } 
        else if (type === 'monthly') {
            const month = this.currentDate.getMonth();
            subTitle.innerText = `Visão Geral: ${monthNames[month]}`;
            let html = "";
            let startWeek = this.getWeekNumber(this.currentDate);
            
            for(let w=startWeek; w<=startWeek+5; w++) { 
                let checkDate = new Date(this.currentDate.getFullYear(), 0, 1);
                checkDate.setDate((w-1)*7 + 1);
                if (checkDate.getMonth() !== month && w > startWeek) break; 

                html += `<div class="sl-week-group"><div class="sl-week-title">Semana ${w}</div>`;
                for (let i = 0; i <= 6; i++) {
                    const currentDayDate = new Date(checkDate);
                    currentDayDate.setDate(checkDate.getDate() + i);
                    if (w === startWeek && i < this.currentDate.getDay()) continue; 
                    if (currentDayDate.getMonth() !== month) continue;

                    const k = keys[i];
                    const d = this.calculateReading(k, w);
                    html += `<div class="sl-item">
                        <div class="sl-day">${names[i].substring(0,3)}<br><small style="font-size:0.8rem; font-weight:normal; color:#9CA3AF;">${this.formatDateShort(currentDayDate).substring(0,5)}</small></div>
                        <div class="sl-content">
                            <span class="sl-theme">${d.theme}</span>
                            <div class="sl-reading">${d.text}</div>
                        </div>
                    </div>`;
                }
                html += `</div>`;
            }
            container.innerHTML = html;
        }
    }
}

// Inicializa o app
const app = new BibleApp();
