// ==============================================
// FUNCIONALIDADES SOCIAIS - VERBUM AI
// ==============================================

class SocialFeatures {
    constructor() {
        this.currentUser = null;
        this.userGroups = [];
        this.friends = [];
        this.challenges = [];
        this.sharedVerses = [];
        this.init();
    }

    init() {
        this.setupShareSystem();
        this.setupGroupSystem();
        this.setupChallengeSystem();
    }

    // Sistema de compartilhamento
    setupShareSystem() {
        this.shareTemplates = [
            {
                id: 'daily_verse',
                name: 'Versículo do Dia',
                template: (data) => `
                    <div class="share-card daily-verse">
                        <div class="share-header">
                            <h3>📖 Versículo do Dia</h3>
                            <span class="date">${new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div class="verse-content">
                            <p class="verse-text">"${data.text}"</p>
                            <p class="verse-reference">${data.reference}</p>
                        </div>
                        <div class="share-footer">
                            <span class="app-name">Verbum AI</span>
                        </div>
                    </div>
                `
            },
            {
                id: 'reading_progress',
                name: 'Progresso de Leitura',
                template: (data) => `
                    <div class="share-card progress-card">
                        <div class="share-header">
                            <h3>📚 Meu Progresso</h3>
                            <span class="streak">🔥 ${data.streak} dias</span>
                        </div>
                        <div class="progress-content">
                            <div class="progress-stats">
                                <div class="stat">
                                    <span class="number">${data.chaptersRead}</span>
                                    <span class="label">Capítulos</span>
                                </div>
                                <div class="stat">
                                    <span class="number">${data.booksCompleted}</span>
                                    <span class="label">Livros</span>
                                </div>
                                <div class="stat">
                                    <span class="number">${data.level}</span>
                                    <span class="label">Nível</span>
                                </div>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${data.yearProgress}%"></div>
                                </div>
                                <span class="progress-text">${data.yearProgress}% do ano</span>
                            </div>
                        </div>
                        <div class="share-footer">
                            <span class="app-name">Verbum AI</span>
                        </div>
                    </div>
                `
            },
            {
                id: 'achievement',
                name: 'Conquista Desbloqueada',
                template: (data) => `
                    <div class="share-card achievement-card">
                        <div class="achievement-glow">
                            <div class="achievement-icon">${data.icon}</div>
                        </div>
                        <div class="achievement-content">
                            <h3>🏆 Conquista Desbloqueada!</h3>
                            <h2>${data.name}</h2>
                            <p>${data.description}</p>
                            <div class="points">+${data.points} pontos</div>
                        </div>
                        <div class="share-footer">
                            <span class="app-name">Verbum AI</span>
                        </div>
                    </div>
                `
            }
        ];
    }

    // Sistema de grupos
    setupGroupSystem() {
        this.groupTypes = [
            { id: 'family', name: 'Família', icon: '👨‍👩‍👧‍👦', maxMembers: 10 },
            { id: 'church', name: 'Igreja', icon: '⛪', maxMembers: 50 },
            { id: 'friends', name: 'Amigos', icon: '👥', maxMembers: 20 },
            { id: 'study', name: 'Estudo Bíblico', icon: '📚', maxMembers: 15 }
        ];
    }

    // Sistema de desafios
    setupChallengeSystem() {
        this.challengeTypes = [
            {
                id: 'weekly_reading',
                name: 'Leitura Semanal',
                description: 'Complete todas as leituras da semana',
                duration: 7, // dias
                points: 100,
                icon: '📅'
            },
            {
                id: 'streak_challenge',
                name: 'Desafio da Sequência',
                description: 'Mantenha uma sequência de leitura',
                duration: 30,
                points: 200,
                icon: '🔥'
            },
            {
                id: 'book_race',
                name: 'Corrida do Livro',
                description: 'Seja o primeiro a completar um livro',
                duration: null, // até completar
                points: 150,
                icon: '🏃‍♂️'
            },
            {
                id: 'group_goal',
                name: 'Meta do Grupo',
                description: 'Grupo deve ler X capítulos juntos',
                duration: 30,
                points: 300,
                icon: '🎯'
            }
        ];
    }

    // Gera imagem para compartilhamento
    async generateShareImage(templateId, data) {
        const template = this.shareTemplates.find(t => t.id === templateId);
        if (!template) return null;

        // Cria elemento temporário
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = template.template(data);
        tempDiv.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 400px;
            font-family: 'Lexend', sans-serif;
        `;
        
        // Adiciona estilos para compartilhamento
        const shareStyles = document.createElement('style');
        shareStyles.textContent = `
            .share-card {
                width: 400px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 20px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
            }

            .share-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
            }

            .share-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                position: relative;
                z-index: 1;
            }

            .share-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .date, .streak {
                background: rgba(255,255,255,0.2);
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 14px;
            }

            .verse-content {
                position: relative;
                z-index: 1;
                margin: 20px 0;
            }

            .verse-text {
                font-size: 16px;
                line-height: 1.6;
                font-style: italic;
                margin: 0 0 10px 0;
            }

            .verse-reference {
                font-size: 14px;
                font-weight: 600;
                text-align: right;
                margin: 0;
                opacity: 0.9;
            }

            .progress-stats {
                display: flex;
                justify-content: space-around;
                margin: 20px 0;
                position: relative;
                z-index: 1;
            }

            .stat {
                text-align: center;
            }

            .stat .number {
                display: block;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 4px;
            }

            .stat .label {
                font-size: 12px;
                opacity: 0.8;
            }

            .progress-bar-container {
                position: relative;
                z-index: 1;
            }

            .progress-bar {
                background: rgba(255,255,255,0.2);
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                background: white;
                height: 100%;
                border-radius: 4px;
            }

            .progress-text {
                font-size: 14px;
                text-align: center;
                display: block;
            }

            .achievement-glow {
                text-align: center;
                margin-bottom: 20px;
                position: relative;
                z-index: 1;
            }

            .achievement-icon {
                font-size: 60px;
                display: inline-block;
                animation: glow 2s infinite;
            }

            .achievement-content {
                text-align: center;
                position: relative;
                z-index: 1;
            }

            .achievement-content h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                opacity: 0.9;
            }

            .achievement-content h2 {
                margin: 0 0 10px 0;
                font-size: 22px;
                font-weight: 700;
            }

            .achievement-content p {
                margin: 0 0 15px 0;
                font-size: 14px;
                opacity: 0.8;
            }

            .points {
                background: rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                font-weight: 600;
            }

            .share-footer {
                text-align: center;
                margin-top: 20px;
                position: relative;
                z-index: 1;
            }

            .app-name {
                font-size: 14px;
                opacity: 0.7;
                font-weight: 500;
            }
        `;
        
        document.head.appendChild(shareStyles);
        document.body.appendChild(tempDiv);

        try {
            // Usa html2canvas para gerar imagem
            const canvas = await html2canvas(tempDiv.firstElementChild, {
                backgroundColor: null,
                scale: 2,
                width: 400,
                height: tempDiv.firstElementChild.offsetHeight
            });
            
            // Remove elementos temporários
            document.body.removeChild(tempDiv);
            document.head.removeChild(shareStyles);
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            document.body.removeChild(tempDiv);
            document.head.removeChild(shareStyles);
            return null;
        }
    }

    // Compartilha via Web Share API ou fallback
    async shareContent(templateId, data, text = '') {
        try {
            const imageDataUrl = await this.generateShareImage(templateId, data);
            
            if (navigator.share && imageDataUrl) {
                // Converte data URL para blob
                const response = await fetch(imageDataUrl);
                const blob = await response.blob();
                const file = new File([blob], 'verbum-share.png', { type: 'image/png' });
                
                await navigator.share({
                    title: 'Verbum AI - Leitura Bíblica',
                    text: text || 'Confira meu progresso na leitura bíblica!',
                    files: [file]
                });
            } else {
                // Fallback: download da imagem
                this.downloadImage(imageDataUrl, 'verbum-share.png');
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            // Fallback: compartilhamento de texto
            this.shareText(text || 'Confira o Verbum AI para leitura bíblica!');
        }
    }

    // Download de imagem
    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Compartilhamento de texto
    shareText(text) {
        if (navigator.share) {
            navigator.share({
                title: 'Verbum AI',
                text: text,
                url: window.location.origin
            });
        } else {
            // Fallback: copia para clipboard
            navigator.clipboard.writeText(text + '\n\n' + window.location.origin)
                .then(() => {
                    alert('Texto copiado para a área de transferência!');
                })
                .catch(() => {
                    // Fallback final: prompt
                    prompt('Copie o texto abaixo:', text + '\n\n' + window.location.origin);
                });
        }
    }

    // Cria um grupo
    async createGroup(groupData) {
        try {
            const groupId = Date.now().toString();
            const group = {
                id: groupId,
                name: groupData.name,
                type: groupData.type,
                description: groupData.description,
                createdBy: this.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                members: [this.currentUser.uid],
                settings: {
                    isPublic: groupData.isPublic || false,
                    allowInvites: groupData.allowInvites !== false,
                    requireApproval: groupData.requireApproval || false
                },
                stats: {
                    totalReads: 0,
                    totalMembers: 1,
                    averageStreak: 0
                }
            };

            await db.collection('groups').doc(groupId).set(group);
            
            // Adiciona usuário ao grupo
            await db.collection('users').doc(this.currentUser.uid)
                .update({
                    groups: firebase.firestore.FieldValue.arrayUnion(groupId)
                });

            return group;
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            throw error;
        }
    }

    // Entra em um grupo
    async joinGroup(groupId, inviteCode = null) {
        try {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            if (!groupDoc.exists) {
                throw new Error('Grupo não encontrado');
            }

            const group = groupDoc.data();
            const groupType = this.groupTypes.find(t => t.id === group.type);
            
            if (group.members.length >= groupType.maxMembers) {
                throw new Error('Grupo está cheio');
            }

            if (group.members.includes(this.currentUser.uid)) {
                throw new Error('Você já está neste grupo');
            }

            // Adiciona membro ao grupo
            await db.collection('groups').doc(groupId).update({
                members: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid),
                'stats.totalMembers': firebase.firestore.FieldValue.increment(1)
            });

            // Adiciona grupo ao usuário
            await db.collection('users').doc(this.currentUser.uid)
                .update({
                    groups: firebase.firestore.FieldValue.arrayUnion(groupId)
                });

            return group;
        } catch (error) {
            console.error('Erro ao entrar no grupo:', error);
            throw error;
        }
    }

    // Cria um desafio
    async createChallenge(challengeData) {
        try {
            const challengeId = Date.now().toString();
            const challenge = {
                id: challengeId,
                type: challengeData.type,
                name: challengeData.name,
                description: challengeData.description,
                createdBy: this.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                startDate: challengeData.startDate || new Date(),
                endDate: challengeData.endDate,
                participants: [this.currentUser.uid],
                settings: challengeData.settings || {},
                leaderboard: [],
                status: 'active'
            };

            await db.collection('challenges').doc(challengeId).set(challenge);
            return challenge;
        } catch (error) {
            console.error('Erro ao criar desafio:', error);
            throw error;
        }
    }

    // Participa de um desafio
    async joinChallenge(challengeId) {
        try {
            await db.collection('challenges').doc(challengeId).update({
                participants: firebase.firestore.FieldValue.arrayUnion(this.currentUser.uid)
            });

            await db.collection('users').doc(this.currentUser.uid)
                .update({
                    challenges: firebase.firestore.FieldValue.arrayUnion(challengeId)
                });
        } catch (error) {
            console.error('Erro ao participar do desafio:', error);
            throw error;
        }
    }

    // Atualiza progresso no desafio
    async updateChallengeProgress(challengeId, progressData) {
        try {
            const challengeRef = db.collection('challenges').doc(challengeId);
            const userProgressRef = challengeRef.collection('progress').doc(this.currentUser.uid);
            
            await userProgressRef.set({
                userId: this.currentUser.uid,
                progress: progressData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Atualiza leaderboard se necessário
            await this.updateLeaderboard(challengeId);
        } catch (error) {
            console.error('Erro ao atualizar progresso do desafio:', error);
        }
    }

    // Atualiza leaderboard
    async updateLeaderboard(challengeId) {
        try {
            const progressDocs = await db.collection('challenges')
                .doc(challengeId)
                .collection('progress')
                .get();

            const leaderboard = [];
            progressDocs.forEach(doc => {
                const data = doc.data();
                leaderboard.push({
                    userId: data.userId,
                    score: this.calculateChallengeScore(data.progress),
                    progress: data.progress
                });
            });

            // Ordena por pontuação
            leaderboard.sort((a, b) => b.score - a.score);

            await db.collection('challenges').doc(challengeId).update({
                leaderboard: leaderboard.slice(0, 10) // Top 10
            });
        } catch (error) {
            console.error('Erro ao atualizar leaderboard:', error);
        }
    }

    // Calcula pontuação do desafio
    calculateChallengeScore(progress) {
        // Implementa lógica específica baseada no tipo de desafio
        return (progress.chaptersRead || 0) * 10 + (progress.streak || 0) * 5;
    }

    // Carrega dados sociais do usuário
    async loadUserSocialData(userId) {
        try {
            this.currentUser = { uid: userId };
            
            // Carrega grupos
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.userGroups = userData.groups || [];
                this.challenges = userData.challenges || [];
            }
        } catch (error) {
            console.error('Erro ao carregar dados sociais:', error);
        }
    }
}

// Instância global
window.socialFeatures = new SocialFeatures();