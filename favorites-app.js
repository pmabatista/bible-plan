// ==============================================
// VERSÍCULOS SALVOS - VERBUM AI
// ==============================================

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

class FavoritesApp {
    constructor() {
        this.currentUser = null;
        this.verses = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfile(user);
                await this.loadVerses();
            } else {
                window.location.href = 'index.html';
            }
        });

        this.setupEventListeners();
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

    setupEventListeners() {
        // Add verse button
        document.getElementById('add-verse-btn')?.addEventListener('click', () => {
            this.showAddModal();
        });

        // Modal buttons
        document.getElementById('close-modal-btn')?.addEventListener('click', () => {
            this.hideAddModal();
        });

        document.getElementById('cancel-modal-btn')?.addEventListener('click', () => {
            this.hideAddModal();
        });

        document.getElementById('save-verse-btn')?.addEventListener('click', () => {
            this.saveVerse();
        });

        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Search
        document.getElementById('search-verses')?.addEventListener('input', (e) => {
            this.searchVerses(e.target.value);
        });
    }

    async loadVerses() {
        try {
            const snapshot = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('favorites')
                .orderBy('createdAt', 'desc')
                .get();

            this.verses = [];
            snapshot.forEach(doc => {
                this.verses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            document.getElementById('verses-count').textContent = this.verses.length;
            this.renderVerses();
        } catch (error) {
            console.error('Erro ao carregar versículos:', error);
            this.showError('Erro ao carregar versículos salvos');
        }
    }

    renderVerses() {
        const grid = document.getElementById('verses-grid');
        
        if (this.verses.length === 0) {
            grid.innerHTML = '<p class="text-center text-stone-400 py-20 col-span-full">Nenhum versículo salvo ainda. Comece sua coleção!</p>';
            return;
        }

        const filtered = this.currentFilter === 'all' ? 
            this.verses : 
            this.verses.filter(v => v.category === this.currentFilter);

        let html = '';
        filtered.forEach(verse => {
            const categoryInfo = this.getCategoryInfo(verse.category);
            const date = verse.createdAt ? new Date(verse.createdAt.seconds * 1000) : new Date();
            const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

            // Variar estilos dos cards
            const isHighlighted = Math.random() > 0.7;
            const cardStyle = isHighlighted ? this.getHighlightedCardStyle() : this.getDefaultCardStyle();

            html += `
                <div class="break-inside-avoid ${cardStyle.containerClass}">
                    <div class="flex justify-between items-start mb-4">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded ${cardStyle.badgeClass}">
                            <span class="material-symbols-outlined text-sm ${cardStyle.iconColor}">${categoryInfo.icon}</span> ${categoryInfo.name}
                        </span>
                        <button class="${cardStyle.favoriteClass} material-symbols-outlined text-xl fill-current transition-colors" 
                                data-verse-id="${verse.id}"
                                onclick="favoritesApp.toggleFavorite('${verse.id}')">
                            favorite
                        </button>
                    </div>

                    <blockquote class="font-reading ${cardStyle.textClass} leading-relaxed relative z-10">
                        "${verse.text}"
                    </blockquote>

                    <div class="mt-4 flex justify-${isHighlighted ? 'end' : 'between'} items-center">
                        ${!isHighlighted ? '<div class="h-px bg-stone-100 flex-1 mr-4"></div>' : ''}
                        <span class="font-display text-sm font-bold ${cardStyle.refClass}">${verse.reference}</span>
                    </div>

                    ${verse.note ? `
                        <div class="mt-4 bg-cream-bg p-3 rounded-lg border border-stone-100 flex items-start gap-2">
                            <span class="material-symbols-outlined text-xs text-accent mt-0.5">sticky_note_2</span>
                            <p class="text-xs text-stone-500 italic">${verse.note}</p>
                        </div>
                    ` : ''}

                    <div class="mt-4 pt-4 border-t ${cardStyle.borderClass} flex items-center justify-between">
                        <div class="flex gap-1">
                            <button class="p-2 rounded-full ${cardStyle.actionBtnClass} transition-colors" 
                                    title="Compartilhar"
                                    onclick="favoritesApp.shareVerse('${verse.id}')">
                                <span class="material-symbols-outlined text-[18px]">share</span>
                            </button>
                            <button class="p-2 rounded-full ${cardStyle.actionBtnClass} transition-colors" 
                                    title="Baixar PDF"
                                    onclick="favoritesApp.downloadVerse('${verse.id}')">
                                <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                            </button>
                            <button class="p-2 rounded-full ${cardStyle.actionBtnClass} transition-colors" 
                                    title="Editar"
                                    onclick="favoritesApp.editVerse('${verse.id}')">
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                        </div>
                        <span class="text-[10px] ${cardStyle.dateClass} px-2 py-1 rounded">${dateStr}</span>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
    }

    getDefaultCardStyle() {
        return {
            containerClass: 'bg-white rounded-xl p-6 border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 relative group quote-bg',
            badgeClass: 'bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500 border border-stone-100',
            iconColor: 'text-accent',
            favoriteClass: 'text-accent hover:text-red-400',
            textClass: 'text-xl text-stone-800',
            refClass: 'text-primary',
            borderClass: 'border-stone-50',
            actionBtnClass: 'text-stone-400 hover:text-primary hover:bg-stone-50',
            dateClass: 'text-stone-400 bg-stone-50'
        };
    }

    getHighlightedCardStyle() {
        return {
            containerClass: 'bg-primary rounded-xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group text-white',
            badgeClass: 'bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10',
            iconColor: 'text-white',
            favoriteClass: 'text-white/80 hover:text-white',
            textClass: 'text-2xl text-white font-medium italic',
            refClass: 'text-accent',
            borderClass: 'border-white/10',
            actionBtnClass: 'text-white/60 hover:text-white hover:bg-white/10',
            dateClass: 'text-white/60 bg-white/5'
        };
    }

    getCategoryInfo(category) {
        const categories = {
            wisdom: { name: 'Sabedoria', icon: 'lightbulb' },
            gospels: { name: 'Evangelho', icon: 'auto_awesome' },
            psalms: { name: 'Salmos', icon: 'water_drop' },
            prophets: { name: 'Profetas', icon: 'campaign' },
            letters: { name: 'Cartas', icon: 'mail' }
        };
        return categories[category] || categories.wisdom;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Atualizar UI dos botões
        document.querySelectorAll('[data-filter]').forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.className = 'px-4 py-1.5 rounded-full bg-primary text-white text-sm font-medium shadow-sm whitespace-nowrap';
            } else {
                btn.className = 'px-4 py-1.5 rounded-full bg-white border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 whitespace-nowrap hover:border-accent hover:text-accent transition-colors';
            }
        });

        this.renderVerses();
    }

    showAddModal() {
        document.getElementById('add-verse-modal').classList.remove('hidden');
        document.getElementById('verse-reference').focus();
    }

    hideAddModal() {
        document.getElementById('add-verse-modal').classList.add('hidden');
        this.clearModalForm();
    }

    clearModalForm() {
        document.getElementById('verse-reference').value = '';
        document.getElementById('verse-text').value = '';
        document.getElementById('verse-category').value = 'wisdom';
        document.getElementById('verse-note').value = '';
    }

    async saveVerse() {
        const reference = document.getElementById('verse-reference').value.trim();
        const text = document.getElementById('verse-text').value.trim();
        const category = document.getElementById('verse-category').value;
        const note = document.getElementById('verse-note').value.trim();

        if (!reference || !text) {
            alert('Por favor, preencha a referência e o texto do versículo.');
            return;
        }

        try {
            await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('favorites')
                .add({
                    reference,
                    text,
                    category,
                    note,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            this.hideAddModal();
            await this.loadVerses();
            this.showSuccess('Versículo salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar versículo:', error);
            this.showError('Erro ao salvar versículo');
        }
    }

    async toggleFavorite(verseId) {
        // TODO: Implementar remoção de favorito com confirmação
        const confirm = window.confirm('Deseja remover este versículo dos favoritos?');
        if (confirm) {
            await this.deleteVerse(verseId);
        }
    }

    async deleteVerse(verseId) {
        try {
            await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('favorites')
                .doc(verseId)
                .delete();

            await this.loadVerses();
            this.showSuccess('Versículo removido');
        } catch (error) {
            console.error('Erro ao remover versículo:', error);
            this.showError('Erro ao remover versículo');
        }
    }

    shareVerse(verseId) {
        const verse = this.verses.find(v => v.id === verseId);
        if (!verse) return;

        const text = `"${verse.text}"\n\n${verse.reference}`;
        
        if (navigator.share) {
            navigator.share({
                title: verse.reference,
                text: text
            });
        } else {
            // Fallback: copiar para clipboard
            navigator.clipboard.writeText(text);
            this.showSuccess('Copiado para a área de transferência!');
        }
    }

    downloadVerse(verseId) {
        const verse = this.verses.find(v => v.id === verseId);
        if (!verse) return;

        // Criar HTML temporário para PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
            <div style="padding: 40px; font-family: 'Merriweather', serif;">
                <h1 style="font-size: 24px; color: #2e4057; margin-bottom: 10px; font-family: 'Lexend', sans-serif;">${verse.reference}</h1>
                <p style="font-size: 18px; line-height: 1.8; color: #292524; margin-bottom: 20px;">${verse.text}</p>
                ${verse.note ? `<div style="border-left: 4px solid #d4a373; padding-left: 20px; margin-top: 30px;">
                    <p style="font-size: 14px; color: #57534e; font-style: italic;">${verse.note}</p>
                </div>` : ''}
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e7e5e4;">
                    <p style="font-size: 12px; color: #a8a29e; text-align: center;">Gerado por Verbum AI</p>
                </div>
            </div>
        `;

        const opt = {
            margin:       10,
            filename:     `${verse.reference.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(tempDiv).save();
    }

    editVerse(verseId) {
        const verse = this.verses.find(v => v.id === verseId);
        if (!verse) return;

        // Preencher modal com dados atuais
        document.getElementById('verse-reference').value = verse.reference;
        document.getElementById('verse-text').value = verse.text;
        document.getElementById('verse-category').value = verse.category || 'sabedoria';
        document.getElementById('verse-note').value = verse.note || '';
        
        // Mudar comportamento do botão salvar para edição
        const saveBtn = document.getElementById('save-verse-btn');
        saveBtn.textContent = 'Atualizar';
        saveBtn.onclick = async () => {
            await this.updateVerse(verseId);
        };
        
        this.showAddModal();
    }

    async updateVerse(verseId) {
        const reference = document.getElementById('verse-reference').value.trim();
        const text = document.getElementById('verse-text').value.trim();
        const category = document.getElementById('verse-category').value;
        const note = document.getElementById('verse-note').value.trim();

        if (!reference || !text) {
            this.showError('Referência e texto são obrigatórios');
            return;
        }

        try {
            await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('favorites')
                .doc(verseId)
                .update({
                    reference,
                    text,
                    category,
                    note,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            this.hideAddModal();
            await this.loadVerses();
            this.showSuccess('Versículo atualizado com sucesso!');
            
            // Restaurar botão salvar
            const saveBtn = document.getElementById('save-verse-btn');
            saveBtn.textContent = 'Salvar';
            saveBtn.onclick = () => this.saveVerse();
        } catch (error) {
            console.error('Erro ao atualizar versículo:', error);
            this.showError('Erro ao atualizar versículo');
        }
    }

    searchVerses(query) {
        if (!query) {
            this.renderVerses();
            return;
        }

        const filtered = this.verses.filter(verse => {
            const reference = verse.reference.toLowerCase();
            const text = verse.text.toLowerCase();
            const note = (verse.note || '').toLowerCase();
            const searchTerm = query.toLowerCase();
            
            return reference.includes(searchTerm) || 
                   text.includes(searchTerm) || 
                   note.includes(searchTerm);
        });

        this.renderFilteredVerses(filtered);
    }

    renderFilteredVerses(filteredVerses) {
        const container = document.getElementById('verses-container');
        
        if (filteredVerses.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-20 text-stone-400">Nenhum versículo encontrado</div>';
            return;
        }
        
        container.innerHTML = filteredVerses.map(verse => this.createVerseCard(verse)).join('');
        
        // Re-attach event listeners
        this.attachVerseEventListeners();
    }

    createVerseCard(verse) {
        const isHighlight = verse.category === 'destaque';
        return `
            <div class="verse-card group ${isHighlight ? 'highlight-card' : ''}">
                <div class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="favoritesApp.editVerse('${verse.id}')" class="p-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm" title="Editar">
                        <span class="material-symbols-outlined text-base text-stone-600">edit</span>
                    </button>
                    <button onclick="favoritesApp.shareVerse('${verse.id}')" class="p-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm" title="Compartilhar">
                        <span class="material-symbols-outlined text-base text-stone-600">share</span>
                    </button>
                    <button onclick="favoritesApp.downloadVerse('${verse.id}')" class="p-1.5 rounded-lg bg-white/80 hover:bg-white shadow-sm" title="Download PDF">
                        <span class="material-symbols-outlined text-base text-stone-600">download</span>
                    </button>
                    <button onclick="favoritesApp.removeVerse('${verse.id}')" class="p-1.5 rounded-lg bg-white/80 hover:bg-red-50 shadow-sm" title="Remover">
                        <span class="material-symbols-outlined text-base text-red-500">delete</span>
                    </button>
                </div>
                <div class="quote-bg"></div>
                <div class="relative">
                    ${isHighlight ? '<span class="inline-flex items-center px-2 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider mb-3">Destaque</span>' : ''}
                    <p class="text-base font-reading leading-relaxed text-stone-700 mb-4">${verse.text}</p>
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-display font-semibold text-primary">${verse.reference}</p>
                        ${verse.note ? '<span class="material-symbols-outlined text-stone-300 text-sm" title="Tem nota">sticky_note_2</span>' : ''}
                    </div>
                    ${verse.note ? `<p class="text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100 italic">${verse.note}</p>` : ''}
                </div>
            </div>
        `;
    }

    attachVerseEventListeners() {
        // Event listeners são chamados via onclick inline nos cards
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
        alert(message);
    }
}

// Inicializa o app
const favoritesApp = new FavoritesApp();
