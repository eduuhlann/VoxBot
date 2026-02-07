require('dotenv').config();
const { Client, Intents } = require('discord.js');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

const GUILD_ID = '1469663632093610234';

// Estrutura de categorias e canais
const serverStructure = [
    {
        categoryName: '📋 INFORMAÇÕES',
        channels: [
            { name: '📢・anúncios', type: 'GUILD_TEXT', topic: 'Anúncios oficiais do VoxBot' },
            { name: '📜・regras', type: 'GUILD_TEXT', topic: 'Regras do servidor' },
            { name: '❓・como-usar', type: 'GUILD_TEXT', topic: 'Tutorial de como usar o VoxBot' },
        ]
    },
    {
        categoryName: '💰 VOXCOINS',
        channels: [
            { name: '🏪・loja', type: 'GUILD_TEXT', topic: 'Loja de recompensas VoxCoins' },
            { name: '🏆・ranking', type: 'GUILD_TEXT', topic: 'Ranking dos maiores farmers' },
            { name: '💳・saldo', type: 'GUILD_TEXT', topic: 'Consulte seu saldo aqui' },
            { name: '📊・estatísticas', type: 'GUILD_TEXT', topic: 'Estatísticas gerais do servidor' },
        ]
    },
    {
        categoryName: '⚙️ CONFIGURAÇÃO',
        channels: [
            { name: '🔧・setup', type: 'GUILD_TEXT', topic: 'Configure sua conta aqui' },
            { name: '🎫・suporte', type: 'GUILD_TEXT', topic: 'Abra um ticket de suporte' },
            { name: '🐛・reportar-bug', type: 'GUILD_TEXT', topic: 'Reporte bugs aqui' },
        ]
    },
    {
        categoryName: '💬 COMUNIDADE',
        channels: [
            { name: '💭・chat-geral', type: 'GUILD_TEXT', topic: 'Conversa geral' },
            { name: '🎮・jogos', type: 'GUILD_TEXT', topic: 'Fale sobre jogos' },
            { name: '🎉・eventos', type: 'GUILD_TEXT', topic: 'Eventos do servidor' },
        ]
    },
    {
        categoryName: '🎤 FARM CALLS',
        channels: [
            { name: '🔊・Farm Call 1', type: 'GUILD_VOICE' },
            { name: '🔊・Farm Call 2', type: 'GUILD_VOICE' },
            { name: '🔊・Farm Call 3', type: 'GUILD_VOICE' },
            { name: '🎵・Farm Call VIP', type: 'GUILD_VOICE' },
        ]
    },
    {
        categoryName: '👑 VIP',
        channels: [
            { name: '💎・vip-chat', type: 'GUILD_TEXT', topic: 'Chat exclusivo VIP' },
            { name: '🎤・vip-call', type: 'GUILD_VOICE' },
        ]
    },
    {
        categoryName: '🔒 ADMINISTRAÇÃO',
        channels: [
            { name: '📝・logs', type: 'GUILD_TEXT', topic: 'Logs do sistema' },
            { name: '⚡・comandos-admin', type: 'GUILD_TEXT', topic: 'Comandos administrativos' },
            { name: '📊・analytics', type: 'GUILD_TEXT', topic: 'Análises e métricas' },
        ]
    }
];

client.once('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        console.log(`Servidor encontrado: ${guild.name}`);

        console.log('\n🚀 Iniciando criação de categorias e canais...\n');

        for (const structure of serverStructure) {
            // Criar categoria
            console.log(`📁 Criando categoria: ${structure.categoryName}`);
            const category = await guild.channels.create(structure.categoryName, {
                type: 'GUILD_CATEGORY',
            });

            // Criar canais dentro da categoria
            for (const channelData of structure.channels) {
                console.log(`  ├─ Criando canal: ${channelData.name}`);
                await guild.channels.create(channelData.name, {
                    type: channelData.type,
                    parent: category.id,
                    topic: channelData.topic || undefined,
                });
            }

            console.log(`✅ Categoria ${structure.categoryName} criada com sucesso!\n`);
        }

        console.log('🎉 Estrutura do servidor criada com sucesso!');
        console.log('✨ Todos os canais e categorias foram configurados.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao criar estrutura:', error);
        process.exit(1);
    }
});

client.login(process.env.BOT_TOKEN);
