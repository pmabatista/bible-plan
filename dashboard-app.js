// ==============================================
// DASHBOARD APP - VERBUM AI
// ==============================================

// Inicializa Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Dados Bíblicos - Plano de Leitura Anual (mesmo do reader-app.js)
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

class DashboardApp {
    constructor() {
        this.currentUser = null;
        this.readDays = new Set();
        this.planCache = null;
        this.init();
    }

    async init() {
        // Carrega tema salvo
        this.loadTheme();
        
        // Monitora autenticação
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfile(user);
                await this.loadUserData();
                await this.initializeDashboard();
                this.setupEventListeners();
                
                // Esconde splash screen
                setTimeout(() => this.hideSplashScreen(), 800);
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const html = document.documentElement;
        const themeBtn = document.getElementById('theme-toggle');
        const icon = themeBtn?.querySelector('.material-symbols-outlined');
        
        if (savedTheme === 'dark') {
            html.classList.remove('light');
            html.classList.add('dark');
            if (icon) icon.textContent = 'light_mode';
        } else {
            html.classList.add('light');
            html.classList.remove('dark');
            if (icon) icon.textContent = 'dark_mode';
        }
    }

    async loadUserData() {
        try {
            // Carrega dados de gamificação
            await window.gamificationSystem.loadUserData(this.currentUser.uid);
            
            // Carrega dados sociais
            await window.socialFeatures.loadUserSocialData(this.currentUser.uid);
            
            // Carrega progresso de leitura
            await this.loadReadingProgress();
            
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }

    async loadReadingProgress() {
        try {
            const progressDoc = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('progress')
                .get();
            
            this.readDays.clear();
            progressDoc.forEach(doc => {
                if (doc.data().read) {
                    this.readDays.add(doc.id);
                }
            });
        } catch (error) {
            console.error('Erro ao carregar progresso:', error);
        }
    }

    async initializeDashboard() {
        this.updateStatsCards();
        this.updateRecentAchievements();
        this.updateBooksProgress();
        this.updateTodayReading();
        this.updateUserGroups();
        this.updateQuickStats();
        this.updateActiveChallenges();
    }

    updateStatsCards() {
        const displayData = window.gamificationSystem.getDisplayData();
        
        // Pontos
        document.getElementById('points-display-card').textContent = displayData.points.toLocaleString();
        
        // Atualiza também o header
        const pointsDisplayHeader = document.querySelector('.points-display');
        if (pointsDisplayHeader) {
            pointsDisplayHeader.textContent = displayData.points.toLocaleString();
        }
        
        // Progresso para próximo nível
        const pointsProgress = document.getElementById('points-progress');
        if (displayData.nextLevel && pointsProgress) {
            const progressBar = window.immersiveUI.createProgressBar(
                pointsProgress, 
                displayData.levelProgress, 
                displayData.level.color
            );
            pointsProgress.innerHTML = '';
            pointsProgress.appendChild(progressBar);
        }
        
        // Sequência
        document.getElementById('streak-display-card').textContent = displayData.streak;
        
        // Atualiza também o header
        const streakDisplayHeader = document.querySelector('.streak-display');
        if (streakDisplayHeader) {
            streakDisplayHeader.innerHTML = `🔥 ${displayData.streak}`;
        }
        
        const streakSubtitle = document.getElementById('streak-subtitle');
        if (displayData.streak > 0) {
            streakSubtitle.textContent = `Maior: ${displayData.stats.longestStreak} dias`;
        }
        
        // Capítulos
        document.getElementById('chapters-display-card').textContent = displayData.stats.totalChapters;
        const chaptersSubtitle = document.getElementById('chapters-subtitle');
        const yearProgress = Math.round((displayData.stats.totalChapters / 365) * 100);
        chaptersSubtitle.textContent = `${yearProgress}% do ano`;
        
        // Nível
        document.getElementById('level-display-card').textContent = displayData.level.level;
        document.getElementById('level-icon-card').textContent = displayData.level.icon;
        document.getElementById('level-icon-card').style.backgroundColor = displayData.level.color + '20';
        
        // Atualiza também o header
        const levelDisplayHeader = document.querySelector('.level-display');
        if (levelDisplayHeader) {
            levelDisplayHeader.innerHTML = `${displayData.level.icon} ${displayData.level.name}`;
        }
        
        // Progresso do nível
        const levelProgress = document.getElementById('level-progress');
        if (displayData.nextLevel && levelProgress) {
            const progressBar = window.immersiveUI.createProgressBar(
                levelProgress, 
                displayData.levelProgress, 
                displayData.level.color
            );
            levelProgress.innerHTML = '';
            levelProgress.appendChild(progressBar);
        }
    }

    updateRecentAchievements() {
        const displayData = window.gamificationSystem.getDisplayData();
        const container = document.getElementById('recent-achievements');
        
        if (displayData.recentAchievements.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-stone-500">
                    <span class="material-symbols-outlined text-4xl mb-2 block">emoji_events</span>
                    <p>Nenhuma conquista ainda</p>
                    <p class="text-sm">Continue lendo para desbloquear!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = displayData.recentAchievements.map(achievement => `
            <div class="flex items-center gap-4 p-4 bg-stone-50 rounded-xl">
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
                    ${achievement.icon}
                </div>
                <div class="flex-1">
                    <h4 class="font-medium text-stone-900">${achievement.name}</h4>
                    <p class="text-sm text-stone-600">${achievement.desc}</p>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-yellow-600">+${achievement.points}</div>
                    <div class="text-xs text-stone-500">pontos</div>
                </div>
            </div>
        `).join('');
    }

    updateBooksProgress() {
        const container = document.getElementById('books-progress');
        const today = new Date();
        const dayKey = keys[today.getDay()];
        const dayData = DB[dayKey];
        
        if (!dayData) return;
        
        container.innerHTML = dayData.livros.slice(0, 5).map(book => {
            // Calcula progresso baseado nas leituras
            const bookProgress = this.calculateBookProgress(book.l);
            const isCompleted = bookProgress >= 100;
            
            return `
                <div class="book-card ${isCompleted ? 'completed' : ''} p-4 rounded-xl">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-medium ${isCompleted ? 'text-white' : 'text-stone-900'}">${book.l}</h4>
                        <span class="text-sm ${isCompleted ? 'text-white/80' : 'text-stone-600'}">${book.c} cap.</span>
                    </div>
                    <div class="progress-bar mb-2">
                        <div class="progress-fill" style="width: ${bookProgress}%; background: ${isCompleted ? 'rgba(255,255,255,0.3)' : 'linear-gradient(90deg, #3B82F6, #1D4ED8)'}"></div>
                    </div>
                    <div class="flex justify-between text-sm ${isCompleted ? 'text-white/80' : 'text-stone-600'}">
                        <span>${Math.round(bookProgress)}% completo</span>
                        <span>${Math.round((bookProgress / 100) * book.c)}/${book.c}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async calculateBookProgress(bookName) {
        try {
            const userId = this.currentUser.uid;
            
            // Busca todas as leituras do usuário
            const progressDocs = await db.collection('users')
                .doc(userId)
                .collection('progress')
                .where('read', '==', true)
                .get();
            
            let chaptersRead = 0;
            const totalChapters = this.getTotalChaptersForBook(bookName);
            
            progressDocs.forEach(doc => {
                const data = doc.data();
                if (data.reading && data.reading.includes(bookName)) {
                    chaptersRead++;
                }
            });
            
            return Math.min((chaptersRead / totalChapters) * 100, 100);
        } catch (error) {
            console.error('Erro ao calcular progresso do livro:', error);
            return 0;
        }
    }

    // Retorna total de capítulos de um livro
    getTotalChaptersForBook(bookName) {
        for (const dayKey of keys) {
            const dayData = DB[dayKey];
            const book = dayData.livros.find(b => b.l === bookName);
            if (book) {
                return book.c;
            }
        }
        return 1; // Fallback
    }

    updateTodayReading() {
        const container = document.getElementById('today-reading');
        const today = new Date();
        const dayKey = keys[today.getDay()];
        const dayData = DB[dayKey];
        
        if (!dayData) return;
        
        const todayDateStr = today.toISOString().split('T')[0];
        const isRead = this.readDays.has(todayDateStr);
        
        container.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="font-medium text-white/90">${dayData.nome}</h3>
                    <p class="text-sm text-white/70">${today.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
                </div>
                <div class="w-8 h-8 rounded-full ${isRead ? 'bg-green-400' : 'bg-white/20'} flex items-center justify-center">
                    <span class="material-symbols-outlined text-sm ${isRead ? 'text-white' : 'text-white/60'}">
                        ${isRead ? 'check' : 'schedule'}
                    </span>
                </div>
            </div>
            <div class="text-sm text-white/80 mt-2">
                ${dayData.livros.length} livros disponíveis
            </div>
        `;
        
        const startButton = document.getElementById('start-reading');
        if (isRead) {
            startButton.textContent = '✓ Leitura Concluída';
            startButton.classList.add('bg-green-500/20', 'hover:bg-green-500/30');
        } else {
            startButton.textContent = 'Começar Leitura';
        }
    }

    updateUserGroups() {
        const container = document.getElementById('user-groups');
        
        // Simula grupos (em implementação real viria do Firebase)
        const mockGroups = [
            { name: 'Família Silva', type: 'family', members: 4, icon: '👨‍👩‍👧‍👦' },
            { name: 'Igreja Central', type: 'church', members: 23, icon: '⛪' }
        ];
        
        if (mockGroups.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-stone-500">
                    <p class="text-sm">Nenhum grupo ainda</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = mockGroups.map(group => `
            <div class="flex items-center gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer">
                <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                    ${group.icon}
                </div>
                <div class="flex-1">
                    <h4 class="font-medium text-stone-900 text-sm">${group.name}</h4>
                    <p class="text-xs text-stone-600">${group.members} membros</p>
                </div>
                <span class="material-symbols-outlined text-stone-400 text-sm">chevron_right</span>
            </div>
        `).join('');
    }

    updateQuickStats() {
        const container = document.getElementById('quick-stats');
        const displayData = window.gamificationSystem.getDisplayData();
        
        const stats = [
            { label: 'Livros Completos', value: displayData.stats.totalBooks, icon: '📚' },
            { label: 'Dias Ativos', value: displayData.stats.daysActive, icon: '📅' },
            { label: 'Conquistas', value: displayData.achievements.length, icon: '🏆' },
            { label: 'Maior Sequência', value: displayData.stats.longestStreak, icon: '🔥' }
        ];
        
        container.innerHTML = stats.map(stat => `
            <div class="flex items-center justify-between py-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${stat.icon}</span>
                    <span class="text-sm text-stone-600">${stat.label}</span>
                </div>
                <span class="font-semibold text-stone-900">${stat.value}</span>
            </div>
        `).join('');
    }

    updateActiveChallenges() {
        const container = document.getElementById('active-challenges');
        
        // Simula desafios ativos
        const mockChallenges = [
            {
                name: 'Leitura Semanal',
                description: 'Complete todas as leituras desta semana',
                progress: 60,
                participants: 12,
                timeLeft: '3 dias'
            }
        ];
        
        if (mockChallenges.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-stone-500">
                    <span class="material-symbols-outlined text-4xl mb-2 block">flag</span>
                    <p>Nenhum desafio ativo</p>
                    <p class="text-sm">Crie um desafio para motivar sua leitura!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = mockChallenges.map(challenge => `
            <div class="p-4 border border-stone-200 rounded-xl">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-medium text-stone-900">${challenge.name}</h4>
                    <span class="text-xs text-stone-500">${challenge.timeLeft}</span>
                </div>
                <p class="text-sm text-stone-600 mb-3">${challenge.description}</p>
                <div class="progress-bar mb-2">
                    <div class="progress-fill" style="width: ${challenge.progress}%"></div>
                </div>
                <div class="flex justify-between text-sm text-stone-600">
                    <span>${challenge.progress}% completo</span>
                    <span>${challenge.participants} participantes</span>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Tema escuro
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Menu mobile
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        document.getElementById('mobile-sidebar-overlay')?.addEventListener('click', () => {
            this.closeMobileMenu();
        });
        
        // Navegação
        document.getElementById('start-reading')?.addEventListener('click', () => {
            window.location.href = 'reader.html';
        });
        
        // Conquistas
        document.getElementById('view-all-achievements')?.addEventListener('click', () => {
            this.showAllAchievements();
        });
        
        document.getElementById('close-achievements')?.addEventListener('click', () => {
            document.getElementById('achievements-modal').classList.add('hidden');
        });
        
        // Grupos
        document.getElementById('create-group')?.addEventListener('click', () => {
            document.getElementById('create-group-modal').classList.remove('hidden');
        });
        
        document.getElementById('join-group')?.addEventListener('click', () => {
            this.joinGroupByCode();
        });
        
        document.getElementById('cancel-group')?.addEventListener('click', () => {
            document.getElementById('create-group-modal').classList.add('hidden');
        });
        
        document.getElementById('group-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createGroup();
        });
        
        // Compartilhamento
        document.getElementById('share-progress')?.addEventListener('click', () => {
            this.shareProgress();
        });
        
        document.getElementById('share-achievement')?.addEventListener('click', () => {
            this.shareAchievement();
        });
        
        document.getElementById('share-verse')?.addEventListener('click', () => {
            this.shareVerse();
        });
        
        // Desafios
        document.getElementById('create-challenge')?.addEventListener('click', () => {
            document.getElementById('create-challenge-modal').classList.remove('hidden');
        });
        
        document.getElementById('cancel-challenge')?.addEventListener('click', () => {
            document.getElementById('create-challenge-modal').classList.add('hidden');
        });
        
        document.getElementById('challenge-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createChallenge();
        });
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeBtn = document.getElementById('theme-toggle');
        const icon = themeBtn?.querySelector('.material-symbols-outlined');
        
        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            html.classList.add('light');
            localStorage.setItem('theme', 'light');
            if (icon) icon.textContent = 'dark_mode';
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            if (icon) icon.textContent = 'light_mode';
        }
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }

    hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
        }
    }

    updateUserProfile(user) {
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) {
            userName.textContent = user.displayName || 'Usuário';
        }
        
        if (userEmail) {
            userEmail.textContent = user.email || 'Anônimo';
        }
        
        if (userAvatar && user.photoURL) {
            userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar" class="w-full h-full rounded-full object-cover">`;
        }
    }

    showAllAchievements() {
        const modal = document.getElementById('achievements-modal');
        const container = document.getElementById('all-achievements');
        const allAchievements = window.gamificationSystem.achievementsList;
        const unlockedAchievements = window.gamificationSystem.achievements;
        
        container.innerHTML = allAchievements.map(achievement => {
            const isUnlocked = unlockedAchievements.has(achievement.id);
            return `
                <div class="p-4 rounded-xl border ${isUnlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-stone-50 border-stone-200'}">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${isUnlocked ? 'bg-yellow-100' : 'bg-stone-200'}">
                            ${isUnlocked ? achievement.icon : '🔒'}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-medium ${isUnlocked ? 'text-stone-900' : 'text-stone-500'}">${achievement.name}</h4>
                            <p class="text-sm ${isUnlocked ? 'text-stone-600' : 'text-stone-400'}">${achievement.desc}</p>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs ${isUnlocked ? 'text-yellow-600' : 'text-stone-400'}">
                            ${isUnlocked ? '✓ Desbloqueada' : 'Bloqueada'}
                        </span>
                        <span class="text-sm font-medium ${isUnlocked ? 'text-yellow-600' : 'text-stone-400'}">
                            +${achievement.points} pts
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        modal.classList.remove('hidden');
    }

    async createGroup() {
        const formData = {
            name: document.getElementById('group-name').value,
            type: document.getElementById('group-type').value,
            description: document.getElementById('group-description').value,
            isPublic: document.getElementById('group-public').checked
        };
        
        try {
            // Usa a função real do social-features.js
            await window.socialFeatures.createGroup(formData);
            document.getElementById('create-group-modal').classList.add('hidden');
            
            // Recarrega a lista de grupos
            await this.updateUserGroups();
            
            // Mostra sucesso
            window.immersiveUI.animations.achievement({
                icon: '👥',
                name: 'Grupo Criado!',
                desc: `${formData.name} foi criado com sucesso`,
                points: 0
            });
            
            // Limpa o formulário
            document.getElementById('group-form').reset();
            
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            alert('Erro ao criar grupo. Tente novamente.');
        }
    }

    // Função para entrar em um grupo por código
    async joinGroupByCode() {
        const code = prompt('Digite o código do grupo:');
        if (!code) return;
        
        try {
            await window.socialFeatures.joinGroup(code);
            await this.updateUserGroups();
            
            window.immersiveUI.animations.achievement({
                icon: '🎉',
                name: 'Entrou no Grupo!',
                desc: 'Você agora faz parte do grupo',
                points: 0
            });
        } catch (error) {
            alert('Código inválido ou grupo não encontrado.');
        }
    }

    async createChallenge() {
        const formData = {
            name: document.getElementById('challenge-name').value,
            type: document.getElementById('challenge-type').value,
            description: document.getElementById('challenge-description').value,
            duration: parseInt(document.getElementById('challenge-duration').value)
        };
        
        // Calcula data de fim
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + formData.duration);
        
        const challengeData = {
            ...formData,
            startDate: startDate,
            endDate: endDate,
            settings: {
                autoJoin: true,
                maxParticipants: 100
            }
        };
        
        try {
            await window.socialFeatures.createChallenge(challengeData);
            document.getElementById('create-challenge-modal').classList.add('hidden');
            
            // Recarrega a lista de desafios
            await this.updateActiveChallenges();
            
            // Mostra sucesso
            window.immersiveUI.animations.achievement({
                icon: '⚔️',
                name: 'Desafio Criado!',
                desc: `${formData.name} está ativo`,
                points: 0
            });
            
            // Limpa o formulário
            document.getElementById('challenge-form').reset();
            
        } catch (error) {
            console.error('Erro ao criar desafio:', error);
            alert('Erro ao criar desafio. Tente novamente.');
        }
    }

    async shareProgress() {
        const displayData = window.gamificationSystem.getDisplayData();
        const today = new Date();
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((today - yearStart) / (24 * 60 * 60 * 1000)) + 1;
        const yearProgress = Math.round((dayOfYear / 365) * 100);
        
        const shareData = {
            streak: displayData.streak,
            chaptersRead: displayData.stats.totalChapters,
            booksCompleted: displayData.stats.totalBooks,
            level: displayData.level.name,
            yearProgress: yearProgress
        };
        
        await window.socialFeatures.shareContent('reading_progress', shareData, 
            `🔥 ${displayData.streak} dias seguidos lendo a Bíblia! ${displayData.stats.totalChapters} capítulos e ${displayData.stats.totalBooks} livros completos. #VerbumAI`
        );
    }

    async shareAchievement() {
        const displayData = window.gamificationSystem.getDisplayData();
        if (displayData.recentAchievements.length === 0) {
            alert('Você ainda não tem conquistas para compartilhar!');
            return;
        }
        
        const latestAchievement = displayData.recentAchievements[0];
        await window.socialFeatures.shareContent('achievement', latestAchievement,
            `🏆 Conquista desbloqueada: ${latestAchievement.name}! ${latestAchievement.desc} #VerbumAI`
        );
    }

    async shareVerse() {
        // Versículo inspiracional do dia
        const verses = [
            { text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.", reference: "Salmos 119:105" },
            { text: "Toda a Escritura é divinamente inspirada, e proveitosa para ensinar, para redargüir, para corrigir, para instruir em justiça.", reference: "2 Timóteo 3:16" },
            { text: "Porque a palavra de Deus é viva e eficaz, e mais penetrante do que espada alguma de dois gumes.", reference: "Hebreus 4:12" }
        ];
        
        const todayVerse = verses[new Date().getDate() % verses.length];
        
        await window.socialFeatures.shareContent('daily_verse', todayVerse,
            `📖 "${todayVerse.text}" - ${todayVerse.reference} #VerbumAI #VersiculoDoDia`
        );
    }
}

// Inicializa o app quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});