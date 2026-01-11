// ==============================================
// CALENDÁRIO/PLANO ANUAL - VERBUM AI
// ==============================================

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

class CalendarApp {
    constructor() {
        this.currentUser = null;
        this.readDays = new Set();
        this.stats = {
            streak: 0,
            chapters: 0,
            books: 0,
            percentage: 0
        };
        this.init();
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfile(user);
                await this.loadUserProgress();
                this.renderCalendar();
            } else {
                window.location.href = 'index.html';
            }
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

    async loadUserProgress() {
        try {
            const snapshot = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('readings')
                .get();

            snapshot.forEach(doc => {
                this.readDays.add(doc.id);
            });

            this.calculateStats();
            this.updateStatsUI();
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        }
    }

    calculateStats() {
        this.stats.chapters = this.readDays.size;
        this.stats.percentage = Math.round((this.readDays.size / 365) * 100);
        
        // Calcular sequência (streak)
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (this.readDays.has(dateStr)) {
                streak++;
            } else {
                break;
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
                <div class="day-sq ${dayClass}" 
                     data-date="${dateStr}" 
                     title="Dia ${day}: ${isRead ? 'Concluído' : 'Pendente'}">
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

    showDayDetails(date) {
        const isRead = this.readDays.has(date);
        const message = isRead ? 
            `Leitura de ${date} já concluída!` : 
            `Gostaria de marcar ${date} como lido?`;
        
        // TODO: Implementar modal com detalhes
        alert(message);
    }
}

// Inicializa o app
const calendarApp = new CalendarApp();
