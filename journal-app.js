// ==============================================
// DIÁRIO DE REFLEXÕES - VERBUM AI
// ==============================================

firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

class JournalApp {
    constructor() {
        this.currentUser = null;
        this.currentNote = null;
        this.notes = [];
        this.saveTimeout = null;
        this.init();
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.updateUserProfile(user);
                await this.loadNotes();
                this.setupEditor();
            } else {
                window.location.href = 'index.html';
            }
        });

        this.setupEventListeners();
        this.updateCurrentDate();
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

    updateCurrentDate() {
        const dateElement = document.getElementById('current-date');
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('pt-BR', options);
    }

    setupEventListeners() {
        // New note button
        document.getElementById('new-note-btn')?.addEventListener('click', () => {
            this.createNewNote();
        });

        // Search
        document.getElementById('search-notes')?.addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });

        // Formatting buttons
        document.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const format = btn.dataset.format;
                const value = btn.dataset.value;
                this.formatText(format, value);
            });
        });

        // Auto-save on content change
        const noteTitle = document.getElementById('note-title');
        const noteContent = document.getElementById('note-content');

        noteTitle?.addEventListener('input', () => {
            this.scheduleAutoSave();
        });

        noteContent?.addEventListener('input', () => {
            this.scheduleAutoSave();
        });
    }

    setupEditor() {
        const editor = document.getElementById('note-content');
        
        // Prevenir formatação padrão do navegador
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    }

    async loadNotes() {
        try {
            const snapshot = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('journal')
                .orderBy('updatedAt', 'desc')
                .limit(50)
                .get();

            this.notes = [];
            snapshot.forEach(doc => {
                this.notes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderNotesList();
            
            // Carregar primeira nota
            if (this.notes.length > 0) {
                this.loadNote(this.notes[0]);
            } else {
                this.createNewNote();
            }
        } catch (error) {
            console.error('Erro ao carregar notas:', error);
        }
    }

    renderNotesList() {
        const notesList = document.getElementById('notes-list');
        
        if (this.notes.length === 0) {
            notesList.innerHTML = '<p class="text-center text-stone-400 py-10 text-sm">Nenhuma nota ainda. Crie sua primeira reflexão!</p>';
            return;
        }

        let html = '';
        this.notes.forEach((note, index) => {
            const date = note.updatedAt ? new Date(note.updatedAt.seconds * 1000) : new Date();
            const dateStr = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const isActive = this.currentNote && this.currentNote.id === note.id;
            const activeClass = isActive ? 'bg-white' : 'hover:bg-white';
            const borderClass = isActive ? 'border-l-4 border-accent' : '';

            html += `
                <div class="p-5 border-b border-paper-border ${activeClass} transition-colors cursor-pointer group ${borderClass}" 
                     data-note-id="${note.id}">
                    <div class="flex justify-between items-start mb-1">
                        <span class="text-[11px] font-bold text-${isActive ? 'primary' : 'stone-400'} uppercase tracking-wider group-hover:text-primary transition-colors">${dateStr}</span>
                        <span class="text-[10px] text-stone-400 font-mono">${timeStr}</span>
                    </div>
                    <h3 class="font-display font-semibold text-stone-800 text-sm mb-2">${note.title || 'Sem título'}</h3>
                    <p class="text-xs text-stone-500 line-clamp-2 font-reading leading-relaxed">
                        ${this.stripHTML(note.content || '').substring(0, 100)}...
                    </p>
                </div>
            `;
        });

        notesList.innerHTML = html;

        // Adicionar event listeners
        document.querySelectorAll('[data-note-id]').forEach(el => {
            el.addEventListener('click', () => {
                const noteId = el.dataset.noteId;
                const note = this.notes.find(n => n.id === noteId);
                if (note) {
                    this.loadNote(note);
                }
            });
        });
    }

    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    loadNote(note) {
        this.currentNote = note;
        
        document.getElementById('note-title').value = note.title || '';
        document.getElementById('note-content').innerHTML = note.content || '<p>Comece a escrever...</p>';
        
        this.renderNotesList(); // Re-render para atualizar a nota ativa
    }

    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.notes.unshift(newNote);
        this.currentNote = newNote;
        
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').innerHTML = '<p>Comece a escrever suas reflexões...</p>';
        
        this.renderNotesList();
    }

    formatText(command, value = null) {
        document.execCommand(command, false, value);
        document.getElementById('note-content').focus();
    }

    scheduleAutoSave() {
        // Mostrar indicador de salvando
        document.getElementById('save-status').textContent = 'Salvando...';
        document.getElementById('save-status').classList.add('animate-pulse');

        // Cancelar timeout anterior
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        // Agendar salvamento
        this.saveTimeout = setTimeout(() => {
            this.saveNote();
        }, 1000); // 1 segundo de debounce
    }

    async saveNote() {
        if (!this.currentNote || !this.currentUser) return;

        try {
            const title = document.getElementById('note-title').value;
            const content = document.getElementById('note-content').innerHTML;

            const noteData = {
                title: title || 'Sem título',
                content: content,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Se é uma nota nova, adicionar createdAt
            if (!this.currentNote.saved) {
                noteData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            }

            await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('journal')
                .doc(this.currentNote.id)
                .set(noteData, { merge: true });

            this.currentNote.saved = true;
            this.currentNote.title = title;
            this.currentNote.content = content;

            // Atualizar UI
            document.getElementById('save-status').textContent = 'Salvo';
            document.getElementById('save-status').classList.remove('animate-pulse');
            
            this.renderNotesList();
        } catch (error) {
            console.error('Erro ao salvar nota:', error);
            document.getElementById('save-status').textContent = 'Erro ao salvar';
        }
    }

    searchNotes(query) {
        if (!query) {
            this.renderNotesList();
            return;
        }

        const filtered = this.notes.filter(note => {
            const title = (note.title || '').toLowerCase();
            const content = this.stripHTML(note.content || '').toLowerCase();
            const searchTerm = query.toLowerCase();
            
            return title.includes(searchTerm) || content.includes(searchTerm);
        });

        // Renderizar apenas notas filtradas
        this.renderNotesList(filtered);
    }

    renderNotesList(notesToRender = null) {
        const notesList = document.getElementById('notes-list');
        const notes = notesToRender || this.notes;
        
        if (notes.length === 0) {
            notesList.innerHTML = '<p class="text-sm text-stone-400 text-center py-10">Nenhuma nota encontrada</p>';
            return;
        }
        
        notesList.innerHTML = notes.map(note => `
            <div class="note-item ${this.currentNoteId === note.id ? 'active' : ''}" data-note-id="${note.id}">
                <div class="font-medium text-sm text-stone-700 mb-1 truncate">${note.title}</div>
                <div class="text-xs text-stone-400">${new Date(note.date).toLocaleDateString('pt-BR')}</div>
            </div>
        `).join('');
        
        // Re-attach click listeners
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadNote(item.dataset.noteId);
            });
        });
    }
}

// Inicializa o app
const journalApp = new JournalApp();
