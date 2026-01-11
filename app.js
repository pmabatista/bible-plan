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
        this.init();
    }

    async init() {
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

    toggleProfile() {
        const modal = document.getElementById('profile-modal');
        modal.classList.toggle('open');
    }

    updateUserProfile() {
        const isAnonymous = this.currentUser?.isAnonymous;
        const userName = isAnonymous ? 'Visitante' : (this.currentUser?.displayName || 'Usuário');
        
        // Header stats
        document.getElementById('user-name').innerText = userName;
        document.getElementById('user-progress').innerText = `${this.readDays.size} dias lidos`;
        
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

    async fetchReadingTime(references) {
        const badge = document.getElementById('reading-timer');
        const icon = document.getElementById('timer-icon');
        const text = document.getElementById('timer-text');
        badge.classList.add('visible');
        icon.classList.add('spinner');
        text.innerText = "Calculando...";
        let totalWords = 0;
        const promises = references.map(async (ref) => {
            try {
                const query = `${ref.book} ${ref.cap}`;
                const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=almeida`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("API Error");
                const json = await response.json();
                if (!json.text) throw new Error("No text");
                return json.text.split(/\s+/).length;
            } catch (e) { return 250; }
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
        document.getElementById('daily-context').innerText = `Hoje é ${names[dayIdx]}, dia de focar em ${data.theme}. Você está na Semana ${week}.`;
        
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

            html += `<div class="list-item ${completedClass}" style="${bg}">
                <input type="checkbox" ${isRead ? 'checked' : ''} onchange="app.toggleDayRead('${dateStr}', this.checked)">
                <div class="list-day">${names[i]}</div>
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
        const month = this.currentDate.getMonth();
        document.getElementById('month-title').innerText = `Visão Geral: ${monthNames[month]}`;
        let html = "";
        for(let w=1; w<=52; w++) {
            let d = new Date(this.currentDate.getFullYear(), 0, 1);
            d.setDate((w-1)*7 + 1);
            if (d.getMonth() === month) {
                html += `<div style="margin-top:15px; font-weight:bold; color:var(--text-main);">Semana ${w}</div>`;
                keys.forEach((k, i) => {
                    const d = this.calculateReading(k, w);
                    html += `<div style="display:flex; justify-content:space-between; padding:2px 0; border-bottom:1px dashed #eee;"><span>${names[i].substring(0,3)}</span><span>${d.text}</span></div>`;
                });
            }
        }
        document.getElementById('monthly-list').innerHTML = html || "Verifique as semanas no calendário.";
    }

    renderYearly() {
        let html = "";
        for(let w=1; w<=52; w+=4) {
            html += `<div style="padding:10px; background:#f9fafb; margin-bottom:5px; border-radius:8px;"><strong>Semana ${w} - ${w+3}</strong><br><span style="font-size:0.8rem; color:#666;">Avanço progressivo nos livros</span></div>`;
        }
        document.getElementById('yearly-list').innerHTML = html;
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

        // CARREGAR TUDO EM PARALELO! 🚀
        const fetchPromises = this.currentReferences.map(async (ref) => {
            try {
                const query = `${ref.book} ${ref.cap}`;
                const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=almeida`;
                const res = await fetch(url);
                const json = await res.json();
                
                let html = `<h3>${ref.book} ${ref.cap}</h3>`;
                
                if (json.verses && json.verses.length > 0) {
                    let chapterText = "";
                    json.verses.forEach(v => {
                        chapterText += `<span class="verse-num">${v.verse}</span>${v.text} `;
                    });
                    html += `<p>${chapterText}</p>`;
                } else {
                    const text = json.text.replace(/\n/g, '<br><br>');
                    html += `<p>${text}</p>`;
                }
                
                return { html, order: this.currentReferences.indexOf(ref) };
            } catch (e) {
                return { 
                    html: `<h3>${ref.book} ${ref.cap}</h3><p style="color:red">Erro ao carregar texto.</p>`,
                    order: this.currentReferences.indexOf(ref)
                };
            }
        });
        
        // Aguarda TODAS as requisições ao mesmo tempo
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
                    <div class="sl-day">${names[i].substring(0,3)}</div>
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
                    if (w === startWeek && i < this.currentDate.getDay()) continue; 
                    const k = keys[i];
                    const d = this.calculateReading(k, w);
                    html += `<div class="sl-item">
                        <div class="sl-day">${names[i].substring(0,3)}</div>
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
