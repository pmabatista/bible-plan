// ==============================================
// INTERFACE IMERSIVA - VERBUM AI
// ==============================================

class ImmersiveUI {
    constructor() {
        this.animations = {
            pointsGain: this.animatePointsGain.bind(this),
            levelUp: this.animateLevelUp.bind(this),
            achievement: this.animateAchievement.bind(this),
            streak: this.animateStreak.bind(this),
            bookProgress: this.animateBookProgress.bind(this)
        };
        this.progressBars = new Map();
        this.init();
    }

    init() {
        this.createProgressStyles();
        this.setupParticleSystem();
    }

    // Cria estilos CSS para animações
    createProgressStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Animações de Gamificação */
            @keyframes pointsGain {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
            }

            @keyframes levelUp {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }

            @keyframes achievement {
                0% { transform: translateX(300px); opacity: 0; }
                20% { transform: translateX(0); opacity: 1; }
                80% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(300px); opacity: 0; }
            }

            @keyframes streak {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes progressFill {
                from { width: 0%; }
                to { width: var(--target-width); }
            }

            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
                50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
            }

            /* Barras de Progresso Animadas */
            .progress-bar {
                position: relative;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                overflow: hidden;
                height: 8px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3B82F6, #1D4ED8);
                border-radius: 10px;
                transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }

            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            /* Partículas */
            .particle {
                position: absolute;
                pointer-events: none;
                border-radius: 50%;
                animation: particle 2s ease-out forwards;
            }

            @keyframes particle {
                0% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) scale(0);
                    opacity: 0;
                }
            }

            /* Notificações de Conquista */
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #F59E0B, #D97706);
                color: white;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: achievement 4s ease-in-out forwards;
                max-width: 300px;
            }

            .achievement-notification .icon {
                font-size: 24px;
                margin-right: 12px;
            }

            .achievement-notification .content {
                display: flex;
                align-items: center;
            }

            .achievement-notification .text {
                flex: 1;
            }

            .achievement-notification .title {
                font-weight: 600;
                margin-bottom: 4px;
            }

            .achievement-notification .desc {
                font-size: 14px;
                opacity: 0.9;
            }

            /* Level Up */
            .level-up-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: levelUp 0.5s ease-out;
            }

            .level-up-content {
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            }

            .level-up-icon {
                font-size: 60px;
                margin-bottom: 20px;
                animation: glow 2s infinite;
            }

            /* Streak Counter */
            .streak-counter {
                display: inline-flex;
                align-items: center;
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
                animation: streak 0.5s ease-in-out;
            }

            .streak-counter .fire {
                margin-right: 8px;
                font-size: 18px;
            }

            /* Pontos Flutuantes */
            .floating-points {
                position: absolute;
                color: #10B981;
                font-weight: 700;
                font-size: 18px;
                pointer-events: none;
                z-index: 100;
                animation: pointsGain 2s ease-out forwards;
            }

            /* Cards de Livro com Progresso */
            .book-card {
                position: relative;
                overflow: hidden;
                border-radius: 12px;
                background: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .book-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }

            .book-card.completed {
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
            }

            .book-card.completed::after {
                content: '✓';
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }

            /* Timeline Bíblica */
            .bible-timeline {
                position: relative;
                padding: 20px 0;
            }

            .timeline-line {
                position: absolute;
                left: 50%;
                top: 0;
                bottom: 0;
                width: 2px;
                background: linear-gradient(to bottom, #3B82F6, #1D4ED8);
                transform: translateX(-50%);
            }

            .timeline-item {
                position: relative;
                margin: 20px 0;
                padding: 0 20px;
            }

            .timeline-item:nth-child(odd) {
                text-align: right;
                padding-right: 60px;
            }

            .timeline-item:nth-child(even) {
                text-align: left;
                padding-left: 60px;
            }

            .timeline-dot {
                position: absolute;
                left: 50%;
                top: 50%;
                width: 12px;
                height: 12px;
                background: #3B82F6;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                border: 3px solid white;
                box-shadow: 0 0 0 3px #3B82F6;
            }

            .timeline-dot.completed {
                background: #10B981;
                box-shadow: 0 0 0 3px #10B981;
            }
        `;
        document.head.appendChild(style);
    }

    // Sistema de partículas
    setupParticleSystem() {
        this.particleContainer = document.createElement('div');
        this.particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
        `;
        document.body.appendChild(this.particleContainer);
    }

    // Anima ganho de pontos
    animatePointsGain(element, points, bonus = 0) {
        const rect = element.getBoundingClientRect();
        const pointsEl = document.createElement('div');
        pointsEl.className = 'floating-points';
        pointsEl.textContent = `+${points}${bonus ? ` (+${bonus})` : ''}`;
        pointsEl.style.left = rect.left + rect.width / 2 + 'px';
        pointsEl.style.top = rect.top + 'px';
        
        document.body.appendChild(pointsEl);
        
        setTimeout(() => {
            pointsEl.remove();
        }, 2000);

        // Partículas
        this.createParticles(rect.left + rect.width / 2, rect.top, '#10B981');
    }

    // Anima level up
    animateLevelUp(levelData) {
        const modal = document.createElement('div');
        modal.className = 'level-up-modal';
        modal.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">${levelData.icon}</div>
                <h2 style="margin: 0 0 10px 0; color: #1F2937;">Parabéns!</h2>
                <p style="margin: 0 0 20px 0; color: #6B7280;">Você alcançou o nível</p>
                <h1 style="margin: 0 0 10px 0; color: ${levelData.color};">${levelData.name}</h1>
                <p style="margin: 0; color: #6B7280; font-size: 14px;">${levelData.minPoints} pontos</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-top: 20px; padding: 10px 20px; background: ${levelData.color}; 
                               color: white; border: none; border-radius: 8px; cursor: pointer;">
                    Continuar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 5000);
    }

    // Anima conquista
    animateAchievement(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="content">
                <div class="icon">${achievement.icon}</div>
                <div class="text">
                    <div class="title">Conquista Desbloqueada!</div>
                    <div class="desc">${achievement.name}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remove após animação
        setTimeout(() => {
            notification.remove();
        }, 4000);

        // Som de conquista (se disponível)
        this.playAchievementSound();
    }

    // Anima streak
    animateStreak(streakCount) {
        const streakElements = document.querySelectorAll('.streak-counter');
        streakElements.forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // Força reflow
            el.style.animation = 'streak 0.5s ease-in-out';
        });
    }

    // Anima progresso do livro
    animateBookProgress(bookElement, progress) {
        const progressBar = bookElement.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
    }

    // Cria partículas
    createParticles(x, y, color) {
        const colors = [color, '#F59E0B', '#3B82F6', '#10B981'];
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: ${Math.random() * 6 + 4}px;
                height: ${Math.random() * 6 + 4}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${Math.random() * 0.5}s;
                transform: translateX(${(Math.random() - 0.5) * 100}px);
            `;
            
            this.particleContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }
    }

    // Cria barra de progresso animada
    createProgressBar(container, progress, color = '#3B82F6') {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="background: ${color}; width: 0%;"></div>
        `;
        
        container.appendChild(progressBar);
        
        // Anima após um pequeno delay
        setTimeout(() => {
            const fill = progressBar.querySelector('.progress-fill');
            fill.style.width = progress + '%';
        }, 100);
        
        return progressBar;
    }

    // Cria timeline de progresso
    createTimeline(container, items) {
        const timeline = document.createElement('div');
        timeline.className = 'bible-timeline';
        timeline.innerHTML = '<div class="timeline-line"></div>';
        
        items.forEach((item, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-dot ${item.completed ? 'completed' : ''}"></div>
                <div class="timeline-content">
                    <h4 style="margin: 0 0 5px 0;">${item.title}</h4>
                    <p style="margin: 0; font-size: 14px; color: #6B7280;">${item.description}</p>
                </div>
            `;
            timeline.appendChild(timelineItem);
        });
        
        container.appendChild(timeline);
        return timeline;
    }

    // Toca som de conquista (se disponível)
    playAchievementSound() {
        try {
            // Cria um som sintético usando Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // Silenciosamente falha se Web Audio não estiver disponível
        }
    }

    // Atualiza display de estatísticas
    updateStatsDisplay(stats, container) {
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="stat-card">
                    <div class="stat-number">${stats.totalChapters}</div>
                    <div class="stat-label">Capítulos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalBooks}</div>
                    <div class="stat-label">Livros</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.longestStreak}</div>
                    <div class="stat-label">Maior Sequência</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.daysActive}</div>
                    <div class="stat-label">Dias Ativos</div>
                </div>
            </div>
        `;
    }
}

// Instância global
window.immersiveUI = new ImmersiveUI();