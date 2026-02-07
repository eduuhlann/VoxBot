# 🎮 Server Management

Esta pasta contém scripts e utilitários para gerenciar o servidor Discord.

## 📁 Estrutura

```
src/server/
├── setupChannels.js    # Script para criar categorias e canais
└── README.md          # Este arquivo
```

## 🚀 Como Usar

### Criar Estrutura de Canais

Para criar todas as categorias e canais no servidor:

```bash
node src/server/setupChannels.js
```

## 📋 Estrutura de Canais Criada

### 📋 INFORMAÇÕES
- 📢・anúncios
- 📜・regras
- ❓・como-usar

### 💰 VOXCOINS
- 🏪・loja
- 🏆・ranking
- 💳・saldo
- 📊・estatísticas

### ⚙️ CONFIGURAÇÃO
- 🔧・setup
- 🎫・suporte
- 🐛・reportar-bug

### 💬 COMUNIDADE
- 💭・chat-geral
- 🎮・jogos
- 🎉・eventos

### 🎤 FARM CALLS
- 🔊・Farm Call 1
- 🔊・Farm Call 2
- 🔊・Farm Call 3
- 🎵・Farm Call VIP

### 👑 VIP
- 💎・vip-chat
- 🎤・vip-call

### 🔒 ADMINISTRAÇÃO
- 📝・logs
- ⚡・comandos-admin
- 📊・analytics

## ⚠️ Importante

- O bot precisa ter permissões de **Administrador** ou **Gerenciar Canais**
- O ID do servidor está configurado em `setupChannels.js`
- Execute apenas uma vez para evitar duplicação de canais
