require('dotenv').config();
const {
    Client: Manager,
    Intents,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Modal,
    TextInputComponent,
    MessageSelectMenu,
    MessageAttachment
} = require('discord.js');
const { Client: Selfbot, RichPresence } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const db = require('./database');
const { decrypt, encrypt } = require('./security');
const supabase = require('./supabase');

// Importa a função do seu extrator.js revisada
const { handleQRExtraction } = require('./extrator');

const manager = new Manager({ intents: [32767] });
const sessions = new Map();
const PANEL_CHANNEL_ID = process.env.PANEL_CHANNEL_ID;

// --- FUNÇÃO START FARM ---
async function startFarm(userId) {
    const user = await db.prepare().get(userId);
    if (!user?.user_token || !user.target_channel) return;

    if (sessions.has(userId)) {
        try { sessions.get(userId).destroy(); sessions.delete(userId); } catch (e) { }
    }

    const sb = new Selfbot({ checkUpdate: false });
    sb.on('ready', async () => {
        console.log(`Farm Online: ${sb.user.tag}`);
        const channel = await sb.channels.fetch(user.target_channel).catch(() => null);

        if (channel) {
            joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfMute: true
            });
        }

        const rpc = new RichPresence(sb)
            .setApplicationId(process.env.RPC_APP_ID)
            .setType(user.rpc_type || 'PLAYING')
            .setName(user.rpc_name || 'VoxBot')
            .setDetails(user.rpc_details || '')
            .setState(user.rpc_state || '')
            .setStartTimestamp(user.farm_started_at || Date.now());

        if (user.rpc_large_image) {
            const imgUrl = `${user.rpc_large_image}?v=${Date.now()}`;
            try {
                const [asset] = await RichPresence.getExternal(sb, process.env.RPC_APP_ID, imgUrl);
                rpc.setAssetsLargeImage(asset?.external_asset_path || imgUrl);
            } catch { rpc.setAssetsLargeImage(imgUrl); }
        }

        if (user.rpc_small_image) {
            const imgUrl = `${user.rpc_small_image}?v=${Date.now()}`;
            try {
                const [asset] = await RichPresence.getExternal(sb, process.env.RPC_APP_ID, imgUrl);
                rpc.setAssetsSmallImage(asset?.external_asset_path || imgUrl);
            } catch { rpc.setAssetsSmallImage(imgUrl); }
        }

        if (user.rpc_button1_label && user.rpc_button1_url) rpc.addButton(user.rpc_button1_label, user.rpc_button1_url);
        if (user.rpc_button2_label && user.rpc_button2_url) rpc.addButton(user.rpc_button2_label, user.rpc_button2_url);

        sb.user.setActivity(rpc);

        if (!user.farm_started_at) {
            await supabase.from('users').update({ farm_started_at: Date.now() }).eq('discord_id', userId);
        }
    });

    sessions.set(userId, sb);
    const tkn = decrypt(user.user_token);
    if (tkn) sb.login(tkn).catch(() => { });
}

// --- ATUALIZAR PAINEL FIXO ---
async function updateFixedPanel() {
    const channel = await manager.channels.fetch(PANEL_CHANNEL_ID).catch(() => null);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 50 });
    const botMsgs = messages.filter(m => m.author.id === manager.user.id);
    if (botMsgs.size > 0) await channel.bulkDelete(botMsgs).catch(() => { });

    const embed = new MessageEmbed()
        .setTitle('VoxBot | Premium Farm System')
        .setDescription('Boas-vindas ao painel de controle do seu sistema de farm.')
        .addFields([
            { name: 'Status do Sistema', value: 'Operacional', inline: true },
            { name: 'Usuarios Online', value: `Online: ${sessions.size}`, inline: true }
        ])
        .setColor('#5865F2')
        .setImage('https://i.imgur.com/tpARxyv.gif')
        .setTimestamp();

    const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('btn_token').setLabel('Conta').setStyle('PRIMARY'),
        new MessageButton().setCustomId('btn_edit_rpc').setLabel('Presença').setStyle('SECONDARY'),
        new MessageButton().setCustomId('btn_edit_type').setLabel('Tipo Atv.').setStyle('SECONDARY'),
        new MessageButton().setCustomId('btn_themes').setLabel('Temas').setStyle('SECONDARY')
    );
    const row2 = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('btn_start').setLabel('Ligar').setStyle('SUCCESS'),
        new MessageButton().setCustomId('btn_stop').setLabel('Parar').setStyle('DANGER')
    );

    await channel.send({ embeds: [embed], components: [row, row2] });
}

// --- ENVIAR PAINEL DE TOKEN ---
async function sendTokenPanel() {
    const channelId = '1471260697198596149';
    const channel = await manager.channels.fetch(channelId).catch(() => null);
    if (!channel) return;

    const embed = new MessageEmbed()
        .setTitle('VoxBot | Central de Autenticação')
        .setDescription('Agora você pode extrair seu token de forma automática e segura utilizando o link de acesso remoto.')
        .addFields([
            { name: 'Extração Automática', value: 'Clique em **Logar via Link** abaixo. O bot enviará um QR Code exclusivo para você escanear e capturar seu token.', inline: false }
        ])
        .setColor('#5865F2')
        .setImage('https://i.imgur.com/tpARxyv.gif');

    const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('btn_extract_token').setLabel('Ver Token Salvo').setStyle('SECONDARY'),
        new MessageButton().setCustomId('btn_extract_auto').setLabel('Logar via Link').setStyle('PRIMARY')
    );

    await channel.send({ embeds: [embed], components: [row] });
}

manager.on('ready', () => {
    console.log(`Manager: ${manager.user.tag}`);
    updateFixedPanel();
    sendTokenPanel();
});

manager.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.content === '!setup') { msg.delete().catch(() => { }); updateFixedPanel(); sendTokenPanel(); }
});

manager.on('interactionCreate', async (i) => {
    try {
        if (i.isButton()) {
            // --- 1. BOTÕES QUE NÃO PODEM TER DEFER (MODALS) ---
            if (i.customId === 'btn_token') {
                const modal = new Modal().setCustomId('mdl_token').setTitle('Acesso Manual');
                modal.addComponents(new MessageActionRow().addComponents(
                    new TextInputComponent().setCustomId('tkn').setLabel('Insira seu Token').setStyle('SHORT').setRequired(true)
                ));
                return await i.showModal(modal).catch(() => { });
            }

            // --- 2. BOTÃO DE EXTRAÇÃO (LÓGICA ISOLADA PARA O EXTRATOR) ---
            if (i.customId === 'btn_extract_auto') {
                // Única forma de evitar erro de interação: dar o defer IMEDIATAMENTE
                await i.deferReply({ ephemeral: true }).catch(() => { });
                return handleQRExtraction(i);
            }

            // --- 3. DEFER PADRÃO PARA OS DEMAIS BOTÕES ---
            if (!i.deferred && !i.replied) await i.deferReply({ ephemeral: true }).catch(() => { });

            const user = await db.prepare().get(i.user.id);

            if (i.customId === 'btn_start') {
                await startFarm(i.user.id);
                return i.editReply('🚀 Farm iniciado!');
            }

            if (i.customId === 'btn_stop') {
                if (sessions.has(i.user.id)) {
                    sessions.get(i.user.id).destroy();
                    sessions.delete(i.user.id);
                    return i.editReply('🛑 Farm desligado.');
                }
                return i.editReply('O farm já está desligado.');
            }

            if (i.customId === 'btn_extract_token') {
                if (!user?.user_token) return i.editReply({ content: 'Sem token salvo.' });
                return i.editReply({ content: `Seu token: \`${decrypt(user.user_token)}\`` });
            }
        }

        // --- MODALS SUBMIT ---
        if (i.isModalSubmit() && i.customId === 'mdl_token') {
            if (!i.deferred && !i.replied) await i.deferReply({ ephemeral: true });
            const token = i.fields.getTextInputValue('tkn');
            await supabase.from('users').upsert({ discord_id: i.user.id, user_token: encrypt(token) });
            return i.editReply('✅ Token salvo com sucesso!');
        }
    } catch (error) {
        console.error('Erro na interação:', error);
    }
});

manager.login(process.env.BOT_TOKEN);