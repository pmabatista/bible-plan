// ==============================================
// CALENDÁRIO/PLANO ANUAL - VERBUM AI
// ==============================================

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

// Dados Bíblicos - Plano de Leitura Anual
const DB = {
    domingo: { nome: "Epístolas", livros: [{ l: "Romanos", c: 16 }, { l: "1 Coríntios", c: 16 }, { l: "2 Coríntios", c: 13 }, { l: "Gálatas", c: 6 }, { l: "Efésios", c: 6 }, { l: "Filipenses", c: 4 }, { l: "Colossenses", c: 4 }, { l: "1 Tessalonicenses", c: 5 }, { l: "2 Tessalonicenses", c: 3 }, { l: "1 Timóteo", c: 6 }, { l: "2 Timóteo", c: 4 }, { l: "Tito", c: 3 }, { l: "Filemom", c: 1 }, { l: "Hebreus", c: 13 }, { l: "Tiago", c: 5 }, { l: "1 Pedro", c: 5 }, { l: "2 Pedro", c: 3 }, { l: "1 João", c: 5 }, { l: "2 João", c: 1 }, { l: "3 João", c: 1 }, { l: "Judas", c: 1 }] },
    segunda: { nome: "Pentateuco", livros: [{ l: "Gênesis", c: 50 }, { l: "Êxodo", c: 40 }, { l: "Levítico", c: 27 }, { l: "Números", c: 36 }, { l: "Deuteronômio", c: 34 }] },
    terca: { nome: "História", livros: [{ l: "Josué", c: 24 }, { l: "Juízes", c: 21 }, { l: "Rute", c: 4 }, { l: "1 Samuel", c: 31 }, { l: "2 Samuel", c: 24 }, { l: "1 Reis", c: 22 }, { l: "2 Reis", c: 25 }, { l: "1 Crônicas", c: 29 }, { l: "2 Crônicas", c: 36 }, { l: "Esdras", c: 10 }, { l: "Neemias", c: 13 }, { l: "Ester", c: 10 }] },
    quarta: { nome: "Salmos", livros: [{ l: "Salmos", c: 150 }] },
    quinta: { nome: "Profecia", livros: [{ l: "Isaías", c: 66 }, { l: "Jeremias", c: 52 }, { l: "Lamentações", c: 5 }, { l: "Ezequiel", c: 48 }, { l: "Daniel", c: 12 }, { l: "Oseias", c: 14 }, { l: "Joel", c: 3 }, { l: "Amós", c: 9 }, { l: "Obadias", c: 1 }, { l: "Jonas", c: 4 }, { l: "Miqueias", c: 7 }, { l: "Naum", c: 3 }, { l: "Habacuque", c: 3 }, { l: "Sofonias", c: 3 }, { l: "Ageu", c: 2 }, { l: "Zacarias", c: 14 }, { l: "Malaquias", c: 4 }, { l: "Apocalipse", c: 22 }] },
    sexta: { nome: "Evangelhos", livros: [{ l: "Mateus", c: 28 }, { l: "Marcos", c: 16 }, { l: "Lucas", c: 24 }, { l: "João", c: 21 }, { l: "Atos", c: 28 }] },
    sabado: { nome: "Sabedoria", livros: [{ l: "Jó", c: 42 }, { l: "Provérbios", c: 31 }, { l: "Eclesiastes", c: 12 }, { l: "Cânticos", c: 8 }] }
};

const keys = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

class CalendarApp {
    constructor() {
        this.currentUser = null;
        this.readDays = new Set();
        this.planCache = null;
        this.stats = {
            streak: 0,
            chapters: 0,
            books: 0,
            percentage: 0
        };
        this.initCache();
        this.init();
    }

    initCache() {
        const cached = localStorage.getItem('bible_plan_cache');
        if (cached) {
            try {
                this.planCache = JSON.parse(cached);
            } catch (e) {
                this.generatePlanCache();
            }
        } else {
            this.generatePlanCache();
        }
    }

    generatePlanCache() {
        this.planCache = {};
        for (let w = 1; w <= 52; w++) {
            this.planCache[w] = {};
            keys.forEach(k => {
                this.planCache[w][k] = this.baseCalculateReading(k, w);
            });
        }
        localStorage.setItem('bible_plan_cache', JSON.stringify(this.planCache));
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

        while (currentGlobalCap <= fim) {
            let accumulatedCaps = 0;
            for (let l of livros) {
                if (currentGlobalCap > accumulatedCaps && currentGlobalCap <= accumulatedCaps + l.c) {
                    const localChapter = currentGlobalCap - accumulatedCaps;
                    fullRefs.push({ book: l.l, cap: localChapter });
                    break;
                }
                accumulatedCaps += l.c;
            }
            currentGlobalCap++;
        }

        let accumulatedCaps = 0;
        for (let l of livros) {
            if (inicio > accumulatedCaps && inicio <= accumulatedCaps + l.c) {
                let capIni = inicio - accumulatedCaps;
                txtIni = `${l.l} ${capIni}`;
                break;
            }
            accumulatedCaps += l.c;
        }

        accumulatedCaps = 0;
        for (let l of livros) {
            if (fim > accumulatedCaps && fim <= accumulatedCaps + l.c) {
                let cFim = fim - accumulatedCaps;
                if (txtIni.includes(l.l)) {
                    let cIni = parseInt(txtIni.split(" ").pop());
                    if (cIni !== cFim) txtIni += `-${cFim}`;
                } else {
                    txtIni += ` a ${l.l} ${cFim}`;
                }
                break;
            }
            accumulatedCaps += l.c;
        }

        return { text: txtIni, references: fullRefs };
    }

    getReadingForDate(date) {
        const dayOfWeek = date.getDay();
        const dayKey = keys[dayOfWeek];
        const weekNumber = this.getWeekNumber(date);
        return this.calculateReading(dayKey, weekNumber);
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfile(user);
                await this.loadUserProgress();
                this.renderCalendar();

                // Esconde a splash screen após carregar os dados
                setTimeout(() => this.hideSplashScreen(), 800);
            } else {
                window.location.href = 'index.html';
            }
        });

        this.setupEventListeners();
    }

    hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }
    }

    setupEventListeners() {
        // Mobile menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Mobile overlay
        document.getElementById('mobile-sidebar-overlay')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');

        if (sidebar && overlay) {
            const isHidden = sidebar.classList.contains('-translate-x-full');
            if (isHidden) {
                sidebar.classList.remove('-translate-x-full');
                sidebar.classList.add('translate-x-0');
                overlay.classList.remove('hidden');
            } else {
                sidebar.classList.add('-translate-x-full');
                sidebar.classList.remove('translate-x-0');
                overlay.classList.add('hidden');
            }
        } else {
            console.warn('Sidebar ou Overlay não encontrado');
        }
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

    async loadUserProgress() {
        if (!this.currentUser) {
            console.warn('Usuário não autenticado - não é possível carregar progresso');
            this.calculateStats();
            this.updateStatsUI();
            this.renderCalendar();
            return;
        }

        try {
            console.log('Carregando progresso do usuário:', this.currentUser.uid);

            db.collection('users')
                .doc(this.currentUser.uid)
                .collection('progress')
                .where('read', '==', true)
                .onSnapshot((snapshot) => {
                    this.readDays.clear();
                    snapshot.forEach(doc => {
                        this.readDays.add(doc.id);
                    });

                    console.log(`✅ ${this.readDays.size} dias lidos carregados do Firebase`);

                    this.calculateStats();
                    this.updateStatsUI();
                    this.renderCalendar();
                    this.renderUpcomingReadings(); // Novo: renderiza a barra lateral direita
                }, (error) => {
                    console.error('Erro ao carregar progresso:', error);
                    this.calculateStats();
                    this.updateStatsUI();
                });

        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
            this.calculateStats();
            this.updateStatsUI();
        }
    }

    calculateStats() {
        this.stats.chapters = this.readDays.size;
        this.stats.percentage = Math.round((this.readDays.size / 365) * 100);

        // Calcular sequência (streak) - começa de hoje e volta no tempo
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (this.readDays.has(dateStr)) {
                streak++;
            } else {
                // Se encontrou um dia não lido, para de contar
                // Mas se for o primeiro dia (hoje), continua checando ontem
                if (i > 0) break;
            }
        }
        this.stats.streak = streak;

        // Calcular livros completos (simplificado)
        this.stats.books = Math.floor(this.readDays.size / 20);
    }

    updateStatsUI() {
        document.getElementById('streak-count').textContent = this.stats.streak;
        document.getElementById('chapters-count').textContent = this.stats.chapters;
        document.getElementById('books-count').textContent = this.stats.books;
        document.getElementById('progress-percentage').textContent = `${this.stats.percentage}% Concluído`;
        document.getElementById('streak-days').textContent = `${this.stats.streak} dias seguidos`;
        document.getElementById('progress-bar').style.width = `${this.stats.percentage}%`;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const currentDay = new Date().getDate();

        // Atualiza o título com o ano atual
        const titleEl = document.getElementById('calendar-title');
        if (titleEl) {
            titleEl.textContent = `Bíblia Anual ${currentYear}`;
        }

        let html = '';

        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
            const isCurrentMonth = month === currentMonth;
            const isPastMonth = month < currentMonth;
            const isFutureMonth = month > currentMonth;

            // Status do mês
            let monthStatus = '';
            let monthClass = '';

            if (isPastMonth) {
                // Verificar se foi completado
                const allDaysRead = this.isMonthComplete(currentYear, month);
                monthStatus = allDaysRead ?
                    '<span class="text-[10px] text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Completo</span>' :
                    '<span class="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full">Parcial</span>';
                monthClass = allDaysRead ? 'shadow-sm' : 'opacity-80';
            } else if (isCurrentMonth) {
                monthStatus = '<span class="text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">Em Andamento</span>';
                monthClass = 'shadow-md ring-1 ring-accent/20';
            } else {
                monthClass = 'opacity-80';
            }

            html += `
                <div class="bg-white p-5 rounded-xl border border-stone-100 ${monthClass}">
                    <h3 class="font-display font-bold text-stone-700 mb-4 text-sm uppercase tracking-wider text-center flex justify-between items-center">
                        <span>${monthNames[month]}</span>
                        ${monthStatus}
                    </h3>
                    <div class="month-grid">
                        ${this.renderMonthDays(currentYear, month, daysInMonth, isCurrentMonth, currentDay)}
                    </div>
                </div>
            `;
        }

        calendarGrid.innerHTML = html;

        // Adicionar event listeners aos dias
        this.attachDayListeners();
    }

    renderMonthDays(year, month, daysInMonth, isCurrentMonth, currentDay) {
        let html = '';

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isRead = this.readDays.has(dateStr);
            const isToday = isCurrentMonth && day === currentDay;
            const isFuture = date > new Date();

            // Busca a leitura do dia
            const reading = this.getReadingForDate(date);
            const dayOfWeek = dayNames[date.getDay()];
            const tooltip = `${dayOfWeek} ${day}: ${reading.theme}\n${reading.text}\n${isRead ? '✓ Concluído' : '○ Pendente'}`;

            let dayClass = 'bg-stone-100';
            let dayContent = '';

            if (isRead) {
                dayClass = 'bg-accent';
            } else if (isFuture) {
                dayClass = 'bg-stone-100';
            }

            if (isToday) {
                dayClass = 'bg-primary animate-pulse relative group';
                dayContent = '<div class="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full border border-white"></div>';
            }

            html += `
                <div class="day-sq ${dayClass} cursor-pointer hover:scale-110 hover:shadow-md transition-all" 
                     data-date="${dateStr}"
                     data-reading="${reading.text}"
                     data-theme="${reading.theme}"
                     title="${tooltip}">
                    ${dayContent}
                </div>
            `;
        }

        return html;
    }

    isMonthComplete(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let completedDays = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];

            if (this.readDays.has(dateStr)) {
                completedDays++;
            }
        }

        return completedDays === daysInMonth;
    }

    attachDayListeners() {
        document.querySelectorAll('.day-sq').forEach(dayElement => {
            dayElement.addEventListener('click', (e) => {
                const date = e.target.dataset.date;
                if (date) {
                    this.showDayDetails(date);
                }
            });
        });
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

    showDayDetails(dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        const isRead = this.readDays.has(dateStr);
        const reading = this.getReadingForDate(date);
        const dayOfWeek = dayNames[date.getDay()];

        const modalHtml = `
            <div id="day-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" style="animation: fadeIn 0.2s ease-out;">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" style="animation: slideUp 0.3s ease-out;">
                    <button onclick="document.getElementById('day-modal').remove()" class="absolute top-4 right-4 text-stone-400 hover:text-stone-600">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                    
                    <div class="mb-4">
                        <div class="text-sm text-stone-500 mb-1">${dayOfWeek}, ${date.toLocaleDateString('pt-BR')}</div>
                        <h2 class="text-2xl font-display font-bold text-primary">${reading.theme}</h2>
                    </div>
                    
                    <div class="bg-cream-bg p-4 rounded-xl mb-4">
                        <div class="text-sm text-stone-500 mb-1">Leitura do Dia:</div>
                        <div class="text-lg font-reading font-semibold text-stone-700">${reading.text}</div>
                    </div>
                    
                    <div class="flex items-center gap-2 mb-6">
                        <span class="material-symbols-outlined text-sm ${isRead ? 'text-green-500' : 'text-stone-300'}">
                            ${isRead ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span class="text-sm ${isRead ? 'text-green-600 font-semibold' : 'text-stone-500'}">
                            ${isRead ? 'Leitura concluída' : 'Pendente'}
                        </span>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="window.location.href='reader.html?date=${dateStr}'" class="flex-1 bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors font-display font-semibold">
                            📖 Ler Agora
                        </button>
                        <button onclick="document.getElementById('day-modal').remove()" class="px-4 py-3 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove modal anterior se existir
        document.getElementById('day-modal')?.remove();

        // Adiciona novo modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    renderUpcomingReadings() {
        const container = document.getElementById('upcoming-readings');
        if (!container) return;

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        let html = '';

        // 1. Renderiza "Hoje"
        const todayReading = this.getReadingForDate(today);
        const todayStr = today.toISOString().split('T')[0];
        const isTodayRead = this.readDays.has(todayStr);
        const dayOfMonth = today.getDate();
        const monthShort = today.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');

        html += `
            <div class="relative">
                <div class="absolute -left-6 top-3 w-1 h-8 bg-primary rounded-r"></div>
                <p class="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 pl-1">Hoje • ${dayOfMonth} ${monthShort}</p>
                <div class="bg-white p-5 rounded-xl border ${isTodayRead ? 'border-green-100 bg-green-50/20' : 'border-stone-200 shadow-md'} group hover:border-primary/30 transition-all cursor-pointer" onclick="window.location.href='reader.html'">
                    <div class="flex justify-between items-start mb-3">
                        <span class="px-2 py-1 rounded ${this.getCategoryColor(today.getDay())} text-[10px] font-bold uppercase tracking-wider">${keys[today.getDay()]} • ${todayReading.theme}</span>
                        <span class="material-symbols-outlined ${isTodayRead ? 'text-green-500' : 'text-stone-300 group-hover:text-primary'} transition-colors">
                            ${isTodayRead ? 'check_circle' : 'play_circle'}
                        </span>
                    </div>
                    <h3 class="font-reading font-bold text-stone-800 text-lg mb-1">${todayReading.text}</h3>
                    <p class="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        ${isTodayRead ? 'Leitura concluída! Ótimo trabalho.' : 'Inicie sua jornada espiritual de hoje.'}
                    </p>
                </div>
            </div>
        `;

        // 2. Renderiza "Esta Semana" (próximos 6 dias)
        html += `
            <div>
                <p class="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 pl-1">Próximos Dias</p>
                <div class="space-y-3">
        `;

        for (let i = 1; i <= 6; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const reading = this.getReadingForDate(date);
            const isRead = this.readDays.has(dateStr);
            const dayName = dayNames[date.getDay()];
            const dayNum = date.getDate();

            html += `
                <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-white border border-transparent hover:border-stone-100 transition-all group cursor-pointer" onclick="calendarApp.showDayDetails('${dateStr}')">
                    <div class="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-stone-100 text-stone-500 group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                        <span class="text-[9px] font-bold uppercase">${dayName}</span>
                        <span class="text-sm font-bold">${dayNum}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-0.5">
                            <h4 class="text-sm font-bold text-stone-700">${reading.theme}</h4>
                            ${isRead ? '<span class="material-symbols-outlined text-green-500 text-xs text-xs font-bold">check_circle</span>' : ''}
                        </div>
                        <p class="text-xs text-stone-500">${reading.text}</p>
                    </div>
                    <span class="material-symbols-outlined text-stone-300 text-sm">chevron_right</span>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    getCategoryColor(dayIndex) {
        const colors = [
            'bg-teal-50 text-teal-700',   // Domingo
            'bg-blue-50 text-blue-700',   // Segunda
            'bg-orange-50 text-orange-700', // Terça
            'bg-purple-50 text-purple-700', // Quarta
            'bg-pink-50 text-pink-700',    // Quinta
            'bg-yellow-50 text-yellow-700', // Sexta
            'bg-stone-50 text-stone-700'   // Sábado
        ];
        return colors[dayIndex] || 'bg-stone-50 text-stone-700';
    }
}

// Inicializa o app
const calendarApp = new CalendarApp();
