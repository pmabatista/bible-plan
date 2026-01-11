// ==============================================
// LEITOR BÍBLICO IMERSIVO - VERBUM AI
// ==============================================

// Inicializa Firebase
firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

class ReaderApp {
    constructor() {
        this.currentUser = null;
        this.currentReading = null;
        this.fontSize = 1.15; // rem
        this.theme = 'light';
        this.bibleCache = new Map(); // Cache em memória para API
        this.init();
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
            // Obter leitura do dia atual
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
            const dayKey = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'][dayOfWeek];

            // Simular leitura do dia (isso deve vir do seu sistema de plano anual)
            this.currentReading = {
                book: 'Gênesis',
                chapter: 1,
                dayNumber: 42,
                dayKey: dayKey
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

    updateHeader() {
        document.getElementById('header-subtitle').textContent = `Dia ${this.currentReading.dayNumber} • Plano Anual`;
        document.getElementById('header-title').textContent = `${this.currentReading.book} ${this.currentReading.chapter}`;
        document.getElementById('book-title').textContent = this.currentReading.book;
        document.getElementById('chapter-title').textContent = `Capítulo ${this.currentReading.chapter}`;
    }

    async loadBibleText() {
        const bibleText = document.getElementById('bible-text');
        bibleText.innerHTML = '<p class="text-center text-stone-400 py-20">Carregando texto bíblico...</p>';

        try {
            // Aqui você deve integrar com uma API bíblica
            // Por enquanto, vou usar um exemplo
            const text = await this.fetchBibleText(this.currentReading.book, this.currentReading.chapter);
            bibleText.innerHTML = this.formatBibleText(text);
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
            return this.formatBibleAPIResponse(data);
        }
        
        // 2. Tenta Cache no LocalStorage
        const saved = localStorage.getItem(cacheKey);
        if (saved) {
            const data = JSON.parse(saved);
            this.bibleCache.set(cacheKey, data);
            return this.formatBibleAPIResponse(data);
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
            
            return this.formatBibleAPIResponse(data);
        } catch (error) {
            console.error(`Erro ao buscar ${query}:`, error);
            return '<p class="text-center text-red-400">Erro ao carregar o texto. Verifique sua conexão.</p>';
        }
    }

    formatBibleAPIResponse(data) {
        if (!data) return '';
        
        let html = '';
        
        // Formatar com verses array (se disponível)
        if (data.verses && data.verses.length > 0) {
            let firstVerse = true;
            data.verses.forEach(v => {
                if (firstVerse) {
                    html += `<p><span class="text-6xl float-left mr-3 mt-[-12px] font-bold text-primary font-reading opacity-20">${v.verse}</span>`;
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
            html = `<p>${data.text.replace(/\n/g, '<br><br>')}</p>`;
        }
        
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

            const prompt = `Você é um companheiro espiritual cristão. Forneça 2-3 insights teológicos e práticos sobre ${this.currentReading.book} ${this.currentReading.chapter}. 
            
Formato:
- Contexto histórico curto
- Reflexão teológica
- Aplicação prática

Use português brasileiro, seja profundo mas acessível.`;

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
        // Converte o texto em cards
        const sections = text.split('\n\n');
        let html = '';

        sections.forEach((section, index) => {
            if (section.trim()) {
                html += `
                    <div class="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div class="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                        <div class="flex items-center justify-between mb-4">
                            <span class="px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">lightbulb</span> Insight ${index + 1}
                            </span>
                        </div>
                        <p class="text-sm text-stone-600 leading-relaxed font-reading">${section}</p>
                    </div>
                `;
            }
        });

        return html;
    }

    getDefaultInsights() {
        return `
            <div class="bg-white p-6 rounded-xl border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div class="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                <div class="flex items-center justify-between mb-4">
                    <span class="px-2 py-1 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">lightbulb</span> Contexto
                    </span>
                </div>
                <h3 class="font-display font-semibold text-stone-800 mb-2">O Princípio de Tudo</h3>
                <p class="text-sm text-stone-600 leading-relaxed font-reading">
                    A palavra hebraica para "princípio" é <em>bereshit</em>. Não se refere apenas a um ponto cronológico, mas à qualidade fundamental da existência.
                </p>
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
        if (!this.currentUser) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            
            await db.collection('users').doc(this.currentUser.uid).collection('progress').doc(today).set({
                completed: true,
                book: this.currentReading.book,
                chapter: this.currentReading.chapter,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Feedback visual
            const btn = document.getElementById('complete-reading-btn');
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Concluído!';
            btn.classList.add('bg-green-600');
            
            setTimeout(() => {
                btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Marcar como Lido';
                btn.classList.remove('bg-green-600');
            }, 2000);
        } catch (error) {
            console.error('Erro ao marcar leitura:', error);
            alert('Erro ao salvar progresso');
        }
    }

    downloadReadingPDF() {
        const element = document.getElementById('bible-text');
        const opt = {
            margin:       10,
            filename:     `Leitura_${this.currentReading.book}_${this.currentReading.chapter}.pdf`,
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
        sidebar.classList.toggle('translate-x-0');
    }

    showError(message) {
        alert(message);
    }
}

// Inicializar app
const app = new ReaderApp();
            
            await db.collection('users').doc(this.currentUser.uid)
                .collection('readings').doc(today).set({
                    completed: true,
                    book: this.currentReading.book,
                    chapter: this.currentReading.chapter,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Feedback visual
            this.showSuccess('✓ Leitura concluída!');
            
            // Atualizar progress bar
            this.updateProgressBar();
        } catch (error) {
            console.error('Erro ao salvar progresso:', error);
            this.showError('Erro ao salvar progresso');
        }
    }

    updateProgressBar() {
        // Calcular progresso (simplificado)
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const currentWidth = parseFloat(progressBar.style.width) || 12;
            const newWidth = Math.min(currentWidth + 0.27, 100); // ~365 dias
            progressBar.style.width = `${newWidth}%`;
        }
    }

    toggleMobileMenu() {
        // Implementar menu mobile
        alert('Menu mobile em desenvolvimento');
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
const readerApp = new ReaderApp();
