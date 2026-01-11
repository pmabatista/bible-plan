# 📖 Bíblia Anual - Plano de Leitura

Aplicação web para acompanhamento de leitura bíblica anual com sincronização em nuvem.

## 🚀 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Firebase (Firestore + Authentication)
- **Deploy:** Railway (estático)

## ✨ Funcionalidades

- ✅ Plano de leitura estruturado por dia da semana
- ✅ Login com Google ou modo anônimo
- ✅ Sincronização de progresso entre dispositivos
- ✅ Visualização diária, semanal, mensal e anual
- ✅ Leitor de versículos integrado
- ✅ Geração de imagens para compartilhamento
- ✅ Download de leitura em PDF
- ✅ Estimativa de tempo de leitura

## 📦 Estrutura do Projeto

```
bible-plan/
├── index.html          # HTML principal
├── styles.css          # Estilos
├── app.js             # Lógica + Firebase
├── .gitignore         # Arquivos ignorados
└── README.md          # Este arquivo
```

## 🔧 Configuração

### 1. Clone o Repositório

```bash
git clone <seu-repo>
cd bible-plan
```

### 2. Configure o Firebase

1. Crie um projeto em: https://console.firebase.google.com/
2. Ative **Firestore Database**
3. Ative **Authentication** (Anônimo + Google)
4. Copie as credenciais do projeto
5. Cole no arquivo `app.js` (linhas 9-16)

### 3. Teste Localmente

Abra o `index.html` em um navegador ou use um servidor local:

```bash
# Python
python -m http.server 8000

# Node.js (http-server)
npx http-server

# VSCode - Live Server extension
# Clique com botão direito no index.html → "Open with Live Server"
```

Acesse: `http://localhost:8000`

## 🚀 Deploy no Railway

### Opção 1: Via GitHub

1. Suba o projeto para o GitHub
2. Acesse: https://railway.app
3. **New Project** → **Deploy from GitHub**
4. Selecione o repositório
5. Railway detecta automaticamente site estático
6. Deploy automático! ✅

### Opção 2: Via Railway CLI

```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## 📊 Estrutura de Dados (Firestore)

```javascript
users/
  {userId}/
    progress/
      "2026-01-10": {
        read: true,
        timestamp: Timestamp
      }
```

## 🔒 Segurança

- ✅ Regras de Firestore configuradas
- ✅ API Key restrita por domínio
- ✅ Limite de gastos configurado
- ✅ Cada usuário acessa apenas seus dados

Veja detalhes em: **[SECURITY.md](SECURITY.md)**

## 🎨 Personalização

### Cores (styles.css)

```css
:root {
    --primary: #2563EB;      /* Azul principal */
    --primary-dark: #1E40AF; /* Azul escuro */
    --accent: #F59E0B;       /* Laranja */
    --success: #10B981;      /* Verde */
}
```

### Plano de Leitura (app.js)

Edite o objeto `DB` para customizar os livros por dia da semana.

## 📱 Compatibilidade

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)

## 🐛 Troubleshooting

### Erro: "Missing or insufficient permissions"
→ Configure as regras do Firestore (veja SECURITY.md)

### Erro: "API key not valid"
→ Verifique se copiou corretamente as credenciais

### Erro: "Auth domain not authorized"
→ Adicione seu domínio Railway nas configurações do Firebase

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças grandes, abra uma issue primeiro.

---

**Feito com ❤️ para leitura bíblica consistente**