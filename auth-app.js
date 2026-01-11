// ==============================================
// AUTH APP - VERBUM AI
// Sistema de autenticação simplificado
// ==============================================

// Inicializa Firebase
firebase.initializeApp(window.FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

class AuthApp {
    constructor() {
        this.init();
    }

    init() {
        // Esconde splash screen após 1 segundo
        setTimeout(() => {
            document.getElementById('splash-screen')?.classList.add('fade-out');
            setTimeout(() => {
                document.getElementById('splash-screen')?.remove();
            }, 500);
        }, 1000);

        // Monitora estado de autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.onUserAuthenticated(user);
            } else {
                this.showLoginModal();
            }
        });
    }

    onUserAuthenticated(user) {
        console.log('✅ Usuário autenticado:', user.email || 'Anônimo');
        
        // Salvar informações do usuário
        this.saveUserData(user);
        
        // Redirecionar para a página principal
        window.location.href = 'reader.html';
    }

    async saveUserData(user) {
        try {
            const userData = {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isAnonymous: user.isAnonymous,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('users').doc(user.uid).set(userData, { merge: true });
        } catch (error) {
            console.error('Erro ao salvar dados do usuário:', error);
        }
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.transition = 'opacity 0.3s';
                modal.style.opacity = '1';
            }, 10);
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            await auth.signInWithPopup(provider);
            // onAuthStateChanged will handle the redirect
        } catch (error) {
            console.error('Erro no login com Google:', error);
            
            if (error.code === 'auth/popup-blocked') {
                alert('Por favor, permita pop-ups para fazer login com Google.');
            } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
                // Usuário fechou o popup, não fazer nada
            } else {
                alert('Erro ao fazer login. Tente novamente.');
            }
        }
    }

    async continueAnonymously() {
        try {
            await auth.signInAnonymously();
            // onAuthStateChanged will handle the redirect
        } catch (error) {
            console.error('Erro no login anônimo:', error);
            alert('Erro ao continuar. Tente novamente.');
        }
    }

    async logout() {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }
}

// Inicializa o app
const authApp = new AuthApp();

// Expõe globalmente para uso nos botões
window.authApp = authApp;
