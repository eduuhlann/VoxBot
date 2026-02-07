require('dotenv').config();
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const { Client: SelfbotClient } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

const db = require('./database');
const crypto = require('crypto');
const RemoteAuth = require('./remoteAuth');
const { MessageAttachment } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const dbConnection = db;

// Active Sessions: Map<discord_id, SelfbotClient>
const sessions = new Map();

// Helper: Generate Random Token
function generateUniqueToken(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Function to start a farming session
async function startFarmSession(userId) {
    const user = dbConnection.prepare('SELECT * FROM users WHERE discord_id = ?').get(userId);
    if (!user || !user.user_token || !user.target_guild || !user.target_channel) return;

    if (sessions.has(userId)) {
        const oldSession = sessions.get(userId);
        oldSession.destroy();
        sessions.delete(userId);
    }

    const sb = new SelfbotClient({ checkUpdate: false });

    sb.on('ready', async () => {
        console.log(`Farming started for ${sb.user.tag}`);

        try {
            const channel = await sb.channels.fetch(user.target_channel);
            if (channel) {
                // Use @discordjs/voice adapter
                joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: true,
                });

                // Rich Presence
                const rpcId = process.env.RPC_APP_ID || undefined;
                sb.user.setActivity('VoxBot', {
                    type: 'LISTENING',
                    applicationId: rpcId,
                    assets: {
                        largeImageURL: 'https://i.imgur.com/k0AXsIY.png',
                    },
                    details: 'Farm Call VoxBot',
                    state: 'VoxBot',
                });

                // Keep-alive or re-join logic could be added here
            }
        } catch (err) {
            console.error(`Failed to join channel for ${userId}:`, err);
        }
    });

    try {
        await sb.login(user.user_token);
        sessions.set(userId, sb);
        dbConnection.prepare('UPDATE users SET status = 1, started_at = ? WHERE id = ?').run(Date.now(), user.id);
    } catch (err) {
        console.error(`Failed to login selfbot for ${userId}:`, err);
    }
}

client.once('ready', async () => {
    console.log(`Manager Bot logged in as ${client.user.tag}`);

    // Send persistent setup panel
    if (process.env.SETUP_CHANNEL_ID) {
        try {
            const channel = await client.channels.fetch(process.env.SETUP_CHANNEL_ID);
            if (channel && channel.isText()) {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('generate_token')
                            .setLabel('Gerar Token')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setCustomId('login_button')
                            .setLabel('Login')
                            .setStyle('PRIMARY'),
                        new MessageButton()
                            .setCustomId('config_account')
                            .setLabel('Configurar Conta')
                            .setStyle('SECONDARY')
                    );

                const embed = new MessageEmbed()
                    .setColor('#10B981')
                    .setTitle('VoxBot - Farm System')
                    .setDescription('Bem-vindo ao sistema de farm do VoxBot.\n\n**Como usar:**\n1. Clique em "Gerar Token" para receber sua chave única.\n2. Clique em "Configurar Conta" para conectar seu Token e configurar o farm.\n3. Selecione o servidor e o canal de voz.')
                    .setImage('https://media.discordapp.net/attachments/692883736940773376/1109156828576403566/VoxBot_Logo.png')
                    .setFooter({ text: 'VoxBot Security', iconURL: client.user.displayAvatarURL() });

                await channel.send({ embeds: [embed], components: [row] });
                console.log(`Setup panel sent to channel ${process.env.SETUP_CHANNEL_ID}`);
            }
        } catch (error) {
            console.error('Failed to send setup panel:', error);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!setup') {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('generate_token')
                    .setLabel('Gerar Token')
                    .setStyle('SUCCESS'),
                new MessageButton()
                    .setCustomId('login_button')
                    .setLabel('Login')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('config_account')
                    .setLabel('Configurar Conta')
                    .setStyle('SECONDARY')
            );

        const embed = new MessageEmbed()
            .setColor('#10B981')
            .setTitle('VoxBot - Farm System')
            .setDescription('Bem-vindo ao sistema de farm do VoxBot.\n\n**Como usar:**\n1.  Clique em "Gerar Token" para receber sua chave única.\n2.  Clique em "Configurar Conta" para conectar seu Token e configurar o farm.\n3.  Selecione o servidor e o canal de voz.')
            .setImage('https://media.discordapp.net/attachments/692883736940773376/1109156828576403566/VoxBot_Logo.png')
            .setFooter({ text: 'VoxBot Security', iconURL: client.user.displayAvatarURL() });

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === 'generate_token') {
            const existingUser = dbConnection.prepare('SELECT generated_token FROM users WHERE discord_id = ?').get(interaction.user.id);

            if (existingUser) {
                return interaction.reply({ content: `Você já possui um token gerado: \`${existingUser.generated_token}\``, ephemeral: true });
            }

            const activeToken = generateUniqueToken();
            dbConnection.prepare('INSERT INTO users (discord_id, generated_token) VALUES (?, ?)').run(interaction.user.id, activeToken);

            return interaction.reply({ content: `Seu novo token de acesso é: \`${activeToken}\`\n**GUARDE COM SEGURANÇA!**`, ephemeral: true });
        }

        if (interaction.customId === 'login_button') {
            const modal = new Modal()
                .setCustomId('modal_login')
                .setTitle('Login com Token');

            const tokenInput = new TextInputComponent()
                .setCustomId('input_login_token')
                .setLabel("Cole seu Token Gerado")
                .setStyle('SHORT')
                .setPlaceholder('Ex: aB3$xY9...')
                .setRequired(true);

            const actionRow = new MessageActionRow().addComponents(tokenInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'config_account') {
            const modal = new Modal()
                .setCustomId('modal_config_account')
                .setTitle('Configuração da Conta');

            const tokenInput = new TextInputComponent()
                .setCustomId('input_unique_token')
                .setLabel("Seu Token Único")
                .setStyle('SHORT')
                .setRequired(true);

            const userTokenInput = new TextInputComponent()
                .setCustomId('input_user_token')
                .setLabel("Seu Token do Discord")
                .setStyle('SHORT')
                .setRequired(true);

            const firstActionRow = new MessageActionRow().addComponents(tokenInput);
            const secondActionRow = new MessageActionRow().addComponents(userTokenInput);

            modal.addComponents(firstActionRow, secondActionRow);
            await interaction.showModal(modal);
        }
    }


    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_login') {
            await interaction.deferReply({ ephemeral: true });
            const loginToken = interaction.fields.getTextInputValue('input_login_token');

            const user = dbConnection.prepare('SELECT * FROM users WHERE generated_token = ?').get(loginToken);

            if (!user) {
                return interaction.editReply({ content: '❌ Token inválido! Verifique se você copiou corretamente ou gere um novo token.', ephemeral: true });
            }

            if (user.discord_id !== interaction.user.id) {
                return interaction.editReply({ content: '❌ Este token não pertence a você!', ephemeral: true });
            }

            // Check if user has discord token configured
            if (!user.user_token) {
                return interaction.editReply({ content: '⚠️ Você ainda não configurou sua conta! Use o botão "Configurar Conta" primeiro.', ephemeral: true });
            }

            // Login with selfbot to get servers
            const selfbot = new SelfbotClient({ checkUpdate: false });

            try {
                await selfbot.login(user.user_token);

                const guilds = selfbot.guilds.cache.map(g => ({
                    label: g.name,
                    value: g.id,
                    description: `ID: ${g.id}`
                })).slice(0, 25);

                selfbot.destroy();

                if (guilds.length === 0) {
                    return interaction.editReply({ content: 'Nenhum servidor encontrado na conta fornecida.', ephemeral: true });
                }

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('select_farm_server')
                            .setPlaceholder('Selecione o Servidor para Farmar')
                            .addOptions(guilds)
                    );

                await interaction.editReply({ content: '✅ Login realizado! Agora selecione o servidor:', components: [row], ephemeral: true });

            } catch (error) {
                console.error("Selfbot login error:", error);
                return interaction.editReply({ content: `Erro ao conectar: \`${error.message}\`. Sua conta pode estar bloqueada ou o token expirou. Use "Configurar Conta" para atualizar.`, ephemeral: true });
            }
        }

        if (interaction.customId === 'modal_config_account') {
            await interaction.deferReply({ ephemeral: true });
            const uniqueToken = interaction.fields.getTextInputValue('input_unique_token');
            const discordToken = interaction.fields.getTextInputValue('input_user_token');

            const user = dbConnection.prepare('SELECT * FROM users WHERE generated_token = ?').get(uniqueToken);

            if (!user) {
                return interaction.editReply({ content: 'Token Único Inválido! Gere um token primeiro.', ephemeral: true });
            }

            if (user.discord_id !== interaction.user.id) {
                return interaction.editReply({ content: 'Este token não pertence a você!', ephemeral: true });
            }

            dbConnection.prepare('UPDATE users SET user_token = ? WHERE id = ?').run(discordToken, user.id);

            const selfbot = new SelfbotClient({ checkUpdate: false });

            try {
                await selfbot.login(discordToken);

                const guilds = selfbot.guilds.cache.map(g => ({
                    label: g.name,
                    value: g.id,
                    description: `ID: ${g.id}`
                })).slice(0, 25);

                selfbot.destroy();

                if (guilds.length === 0) {
                    return interaction.editReply({ content: 'Nenhum servidor encontrado na conta fornecida. (Ou conta bloqueada/inválida)', ephemeral: true });
                }

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('select_farm_server')
                            .setPlaceholder('Selecione o Servidor para Farmar')
                            .addOptions(guilds)
                    );

                await interaction.editReply({ content: 'Conta validada! Agora selecione o servidor:', components: [row], ephemeral: true });

            } catch (error) {
                console.error("Selfbot login error:", error);
                return interaction.editReply({ content: `Erro ao conectar na conta: \`${error.message}\`. Verifique o token e se a conta tem 2FA/Captcha.`, ephemeral: true });
            }
        }
    }

    if (interaction.isSelectMenu()) {
        if (interaction.customId === 'select_farm_server') {
            await interaction.deferUpdate(); // Acknowledge selection
            const guildId = interaction.values[0];
            const userId = interaction.user.id;

            dbConnection.prepare('UPDATE users SET target_guild = ? WHERE discord_id = ?').run(guildId, userId);

            const user = dbConnection.prepare('SELECT user_token FROM users WHERE discord_id = ?').get(userId);
            if (!user || !user.user_token) return interaction.followUp({ content: 'Erro: Token de usuário não encontrado.', ephemeral: true });

            const selfbot = new SelfbotClient({ checkUpdate: false });
            try {
                await selfbot.login(user.user_token);
                // We need to fetch the guild to get channels
                const guild = await selfbot.guilds.fetch(guildId);

                // Filter for Voice Channels
                const channels = guild.channels.cache
                    .filter(c => c.type === 'GUILD_VOICE')
                    .map(c => ({
                        label: c.name.substring(0, 25), // Label limit
                        value: c.id,
                        description: `Users: ${c.members.size}`
                    }))
                    .slice(0, 25);

                selfbot.destroy();

                if (channels.length === 0) {
                    return interaction.followUp({ content: 'Nenhum canal de voz encontrado neste servidor.', ephemeral: true });
                }

                const row = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('select_farm_channel')
                            .setPlaceholder('Selecione o Canal de Voz')
                            .addOptions(channels)
                    );

                await interaction.editReply({ content: `Servidor selecionado! Agora escolha o canal de voz:`, components: [row], ephemeral: true });

            } catch (error) {
                console.error("Fetch channels error:", error);
                return interaction.followUp({ content: `Erro ao buscar canais: ${error.message}`, ephemeral: true });
            }
        }

        if (interaction.customId === 'select_farm_channel') {
            await interaction.deferUpdate();
            const channelId = interaction.values[0];
            const userId = interaction.user.id;

            dbConnection.prepare('UPDATE users SET target_channel = ? WHERE discord_id = ?').run(channelId, userId);

            await interaction.editReply({ content: `✅ **Configuração Concluída!**\nServidor e Canal definidos.\nIniciando sistema de farm...`, components: [] });

            // START FARMING
            startFarmSession(userId);
        }
    }
});

client.login(process.env.BOT_TOKEN);
