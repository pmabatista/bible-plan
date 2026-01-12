// ==============================================
// SISTEMA DE GAMIFICAÇÃO - VERBUM AI
// ==============================================

class GamificationSystem {
    constructor() {
        this.points = 0;
        this.level = 1;
        this.streak = 0;
        this.achievements = new Set();
        this.stats = {
            totalChapters: 0,
            totalBooks: 0,
            longestStreak: 0,
            daysActive: 0,
            favoriteDay: null
        };
        this.levels = [
            { level: 1, name: "Iniciante", minPoints: 0, icon: "🌱", color: "#10B981" },
            { level: 2, name: "Buscador", minPoints: 100, icon: "🔍", color: "#3B82F6" },
            { level: 3, name: "Discípulo", minPoints: 300, icon: "📖", color: "#8B5CF6" },
            { level: 4, name: "Estudioso", minPoints: 600, icon: "🎓", color: "#F59E0B" },
            { level: 5, name: "Sábio", minPoints: 1000, icon: "💡", color: "#EF4444" },
            { level: 6, name: "Mestre", minPoints: 1500, icon: "👑", color: "#DC2626" }
        ];
        this.achievementsList = [
            // Primeiros passos
            { id: "first_read", name: "Primeira Leitura", desc: "Complete sua primeira leitura", icon: "🎯", points: 20 },
            { id: "first_week", name: "Primeira Semana", desc: "Leia por 7 dias seguidos", icon: "📅", points: 50 },
            { id: "first_month", name: "Primeiro Mês", desc: "Leia por 30 dias seguidos", icon: "🗓️", points: 100 },
            
            // Sequências (Streaks)
            { id: "streak_7", name: "Semana Dedicada", desc: "7 dias seguidos", icon: "🔥", points: 30 },
            { id: "streak_14", name: "Duas Semanas", desc: "14 dias seguidos", icon: "⚡", points: 60 },
            { id: "streak_30", name: "Mês Completo", desc: "30 dias seguidos", icon: "💪", points: 120 },
            { id: "streak_60", name: "Perseverança", desc: "60 dias seguidos", icon: "🏆", points: 200 },
            { id: "streak_100", name: "Centurião", desc: "100 dias seguidos", icon: "👑", points: 300 },
            
            // Livros completos
            { id: "book_complete", name: "Livro Completo", desc: "Complete um livro inteiro", icon: "📚", points: 40 },
            { id: "gospel_complete", name: "Evangelista", desc: "Complete os 4 Evangelhos", icon: "✝️", points: 150 },
            { id: "pentateuch_complete", name: "Fundamentos", desc: "Complete o Pentateuco", icon: "📜", points: 200 },
            { id: "psalms_complete", name: "Salmista", desc: "Complete todos os Salmos", icon: "🎵", points: 250 },
            
            // Especiais
            { id: "early_bird", name: "Madrugador", desc: "Leia antes das 7h", icon: "🌅", points: 25 },
            { id: "night_owl", name: "Coruja", desc: "Leia depois das 22h", icon: "🦉", points: 25 },
            { id: "weekend_warrior", name: "Guerreiro do Fim de Semana", desc: "Leia todos os fins de semana do mês", icon: "⚔️", points: 80 },
            { id: "perfect_week", name: "Semana Perfeita", desc: "Complete todas as leituras da semana", icon: "⭐", points: 70 },
            
            // Quantidade
            { id: "chapters_50", name: "Meio Século", desc: "Leia 50 capítulos", icon: "📖", points: 100 },
            { id: "chapters_100", name: "Centenário", desc: "Leia 100 capítulos", icon: "💯", points: 150 },
            { id: "chapters_365", name: "Ano Completo", desc: "Leia 365 capítulos", icon: "🎊", points: 500 }
        ];
    }

    // Carrega dados do usuário
    async loadUserData(userId) {
        try {
            const doc = await db.collection('users').doc(userId).collection('gamification').doc('stats').get();
            if (doc.exists) {
                const data = doc.data();
                this.points = data.points || 0;
                this.level = data.level || 1;
                this.streak = data.streak || 0;
                this.achievements = new Set(data.achievements || []);
                this.stats = { ...this.stats, ...data.stats };
            }
        } catch (error) {
            console.error('Erro ao carregar dados de gamificação:', error);
        }
    }

    // Salva dados do usuário
    async saveUserData(userId) {
        try {
            await db.collection('users').doc(userId).collection('gamification').doc('stats').set({
                points: this.points,
                level: this.level,
                streak: this.streak,
                achievements: Array.from(this.achievements),
                stats: this.stats,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao salvar dados de gamificação:', error);
        }
    }

    // Adiciona pontos por leitura
    addReadingPoints(chaptersRead = 1, isStreak = false) {
        let basePoints = chaptersRead * 10; // 10 pontos por capítulo
        let bonusPoints = 0;

        // Bônus por sequência
        if (isStreak) {
            if (this.streak >= 7) bonusPoints += Math.floor(basePoints * 0.2); // +20%
            if (this.streak >= 30) bonusPoints += Math.floor(basePoints * 0.3); // +30% adicional
            if (this.streak >= 60) bonusPoints += Math.floor(basePoints * 0.5); // +50% adicional
        }

        const totalPoints = basePoints + bonusPoints;
        this.points += totalPoints;
        this.updateLevel();

        return {
            base: basePoints,
            bonus: bonusPoints,
            total: totalPoints,
            levelUp: this.checkLevelUp()
        };
    }

    // Atualiza nível baseado nos pontos
    updateLevel() {
        const newLevel = this.levels.findLast(l => this.points >= l.minPoints);
        if (newLevel && newLevel.level > this.level) {
            this.level = newLevel.level;
            return true; // Level up!
        }
        return false;
    }

    // Verifica se subiu de nível
    checkLevelUp() {
        const currentLevelData = this.levels.find(l => l.level === this.level);
        const nextLevelData = this.levels.find(l => l.level === this.level + 1);
        
        return {
            current: currentLevelData,
            next: nextLevelData,
            progress: nextLevelData ? 
                ((this.points - currentLevelData.minPoints) / (nextLevelData.minPoints - currentLevelData.minPoints)) * 100 : 100
        };
    }

    // Verifica e desbloqueia conquistas
    checkAchievements(readingData) {
        const newAchievements = [];

        // Primeira leitura
        if (!this.achievements.has('first_read') && this.stats.totalChapters >= 1) {
            this.unlockAchievement('first_read');
            newAchievements.push('first_read');
        }

        // Conquistas de sequência
        const streakAchievements = [
            { id: 'streak_7', days: 7 },
            { id: 'streak_14', days: 14 },
            { id: 'streak_30', days: 30 },
            { id: 'streak_60', days: 60 },
            { id: 'streak_100', days: 100 }
        ];

        streakAchievements.forEach(achievement => {
            if (!this.achievements.has(achievement.id) && this.streak >= achievement.days) {
                this.unlockAchievement(achievement.id);
                newAchievements.push(achievement.id);
            }
        });

        // Conquistas por quantidade de capítulos
        const chapterAchievements = [
            { id: 'chapters_50', count: 50 },
            { id: 'chapters_100', count: 100 },
            { id: 'chapters_365', count: 365 }
        ];

        chapterAchievements.forEach(achievement => {
            if (!this.achievements.has(achievement.id) && this.stats.totalChapters >= achievement.count) {
                this.unlockAchievement(achievement.id);
                newAchievements.push(achievement.id);
            }
        });

        // Conquista por horário (se fornecido)
        if (readingData.hour !== undefined) {
            if (!this.achievements.has('early_bird') && readingData.hour < 7) {
                this.unlockAchievement('early_bird');
                newAchievements.push('early_bird');
            }
            if (!this.achievements.has('night_owl') && readingData.hour >= 22) {
                this.unlockAchievement('night_owl');
                newAchievements.push('night_owl');
            }
        }

        return newAchievements;
    }

    // Desbloqueia uma conquista
    unlockAchievement(achievementId) {
        const achievement = this.achievementsList.find(a => a.id === achievementId);
        if (achievement && !this.achievements.has(achievementId)) {
            this.achievements.add(achievementId);
            this.points += achievement.points;
            this.updateLevel();
            return achievement;
        }
        return null;
    }

    // Atualiza estatísticas
    updateStats(readingData) {
        this.stats.totalChapters += readingData.chaptersRead || 1;
        if (readingData.bookCompleted) {
            this.stats.totalBooks += 1;
        }
        if (readingData.streak > this.stats.longestStreak) {
            this.stats.longestStreak = readingData.streak;
        }
        this.stats.daysActive += 1;

        // Atualiza dia favorito
        const dayStats = this.stats.dayStats || {};
        const today = new Date().getDay();
        dayStats[today] = (dayStats[today] || 0) + 1;
        this.stats.dayStats = dayStats;

        // Encontra dia favorito
        let maxReads = 0;
        let favoriteDay = null;
        Object.entries(dayStats).forEach(([day, count]) => {
            if (count > maxReads) {
                maxReads = count;
                favoriteDay = parseInt(day);
            }
        });
        this.stats.favoriteDay = favoriteDay;
    }

    // Processa uma leitura completa
    async processReading(userId, readingData) {
        // Atualiza estatísticas
        this.updateStats(readingData);

        // Adiciona pontos
        const pointsResult = this.addReadingPoints(
            readingData.chaptersRead || 1, 
            readingData.isStreak || false
        );

        // Verifica conquistas
        const newAchievements = this.checkAchievements(readingData);

        // Salva dados
        await this.saveUserData(userId);

        return {
            points: pointsResult,
            achievements: newAchievements.map(id => this.achievementsList.find(a => a.id === id)),
            levelUp: pointsResult.levelUp,
            stats: this.stats
        };
    }

    // Retorna dados para exibição
    getDisplayData() {
        const currentLevel = this.levels.find(l => l.level === this.level);
        const nextLevel = this.levels.find(l => l.level === this.level + 1);
        const levelProgress = this.checkLevelUp();

        return {
            points: this.points,
            level: currentLevel,
            nextLevel: nextLevel,
            levelProgress: levelProgress.progress,
            streak: this.streak,
            achievements: Array.from(this.achievements).map(id => 
                this.achievementsList.find(a => a.id === id)
            ),
            stats: this.stats,
            recentAchievements: Array.from(this.achievements)
                .slice(-3)
                .map(id => this.achievementsList.find(a => a.id === id))
        };
    }
}

// Instância global
window.gamificationSystem = new GamificationSystem();