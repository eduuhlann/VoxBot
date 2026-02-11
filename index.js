require('dotenv').config();
const { Client: Manager, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageSelectMenu } = require('discord.js');
const { Client: Selfbot, RichPresence } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const db = require('./database');
const { decrypt, encrypt } = require('./security');
const supabase = require('./supabase');

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
        console.log(`✅ Farm Online: ${sb.user.tag}`);
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
            .setName(user.rpc_name || 'VoxBot')
            .setDetails(user.rpc_details || '')
            .setState(user.rpc_state || '')
            .setStartTimestamp(Date.now());

        if (user.rpc_large_image) {
            const imgUrl = `${user.rpc_large_image}?v=${Date.now()}`;
            try {
                const [asset] = await RichPresence.getExternal(sb, process.env.RPC_APP_ID, imgUrl);
                rpc.setAssetsLargeImage(asset?.external_asset_path || imgUrl);
            } catch { rpc.setAssetsLargeImage(imgUrl); }
        }
        sb.user.setActivity(rpc);
    });
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
        .setTitle('💎 VoxBot | Painel de Farm')
        .setDescription('Configure sua conta, personalize seu status e ligue o farm abaixo.')
        .setColor('#5865F2');

    const row = new MessageActionRow().addComponents(
        new MessageButton().setCustomId('btn_token').setLabel('Configurar Conta').setStyle('PRIMARY').setEmoji('⚙️'),
        new MessageButton().setCustomId('btn_edit_rpc').setLabel('Editar Presença').setStyle('SECONDARY').setEmoji('📝'),
        new MessageButton().setCustomId('btn_start').setLabel('Ligar').setStyle('SUCCESS').setEmoji('🚀'),
        new MessageButton().setCustomId('btn_stop').setLabel('Desligar').setStyle('DANGER').setEmoji('🛑')
    );

    await channel.send({ embeds: [embed], components: [row] });
}

manager.on('ready', () => {
    console.log(`🤖 Manager: ${manager.user.tag}`);
    updateFixedPanel();
});

manager.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.content === '!setup') {
        msg.delete().catch(() => { });
        updateFixedPanel();
    }
});

manager.on('interactionCreate', async (i) => {

    // BOTÕES DO PAINEL
    if (i.isButton()) {
        if (i.customId === 'btn_token') {
            const modal = new Modal().setCustomId('mdl_token').setTitle('Acesso');
            modal.addComponents(new MessageActionRow().addComponents(
                new TextInputComponent().setCustomId('tkn').setLabel('Token').setStyle('SHORT').setRequired(true)
            ));
            return i.showModal(modal).catch(() => { });
        }

        // NOVO: BOTÃO DE EDITAR TEXTOS E IMAGEM
        if (i.customId === 'btn_edit_rpc') {
            const user = await db.prepare().get(i.user.id);
            const modal = new Modal().setCustomId('mdl_edit_rpc').setTitle('Personalizar Presença');

            modal.addComponents(
                new MessageActionRow().addComponents(
                    new TextInputComponent().setCustomId('rpc_n').setLabel('Nome da Atividade').setStyle('SHORT').setValue(user?.rpc_name || 'VoxBot')
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent().setCustomId('rpc_d').setLabel('Detalhes (Linha 1)').setStyle('SHORT').setValue(user?.rpc_details || '').setRequired(false)
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent().setCustomId('rpc_s').setLabel('Estado (Linha 2)').setStyle('SHORT').setValue(user?.rpc_state || '').setRequired(false)
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent().setCustomId('rpc_img').setLabel('Link Direto Imgur').setStyle('SHORT').setValue(user?.rpc_large_image || '').setPlaceholder('https://i.imgur.com/abc.png').setRequired(false)
                )
            );
            return i.showModal(modal).catch(() => { });
        }

        if (i.customId === 'btn_start') {
            await i.deferReply({ ephemeral: true }).catch(() => { });
            await startFarm(i.user.id);
            return i.editReply('🚀 Farm iniciado!');
        }
        if (i.customId === 'btn_stop') {
            sessions.get(i.user.id)?.destroy();
            sessions.delete(i.user.id);
            return i.reply({ content: '🛑 Desligado.', ephemeral: true }).catch(() => { });
        }
    }

    // SUBMIT DO MODAL DE EDIÇÃO
    if (i.isModalSubmit() && i.customId === 'mdl_edit_rpc') {
        await i.deferReply({ ephemeral: true });

        const updates = {
            rpc_name: i.fields.getTextInputValue('rpc_n'),
            rpc_details: i.fields.getTextInputValue('rpc_d'),
            rpc_state: i.fields.getTextInputValue('rpc_s'),
            rpc_large_image: i.fields.getTextInputValue('rpc_img')
        };

        await supabase.from('users').update(updates).eq('discord_id', i.user.id);
        return i.editReply('✅ Presença atualizada! Reinicie o farm para aplicar.');
    }

    // LÓGICA DE TOKEN E SELEÇÃO (CONTINUA IGUAL)
    if (i.isModalSubmit() && i.customId === 'mdl_token') {
        await i.deferReply({ ephemeral: true }).catch(() => { });
        const token = i.fields.getTextInputValue('tkn');
        const tempSb = new Selfbot({ checkUpdate: false });
        try {
            await tempSb.login(token);
            const guilds = tempSb.guilds.cache.map(g => ({ label: g.name.substring(0, 50), value: g.id })).slice(0, 25);
            const menu = new MessageSelectMenu().setCustomId(`sel_guild_${token}`).setPlaceholder('Selecione o Servidor').addOptions(guilds);
            await i.editReply({ content: '✅ Escolha o Servidor:', components: [new MessageActionRow().addComponents(menu)] });
            tempSb.destroy();
        } catch { await i.editReply('❌ Token inválido.'); }
    }

    if (i.isSelectMenu()) {
        await i.deferUpdate().catch(() => { });
        const token = i.customId.split('_').pop();

        if (i.customId.startsWith('sel_guild_')) {
            const tempSb = new Selfbot({ checkUpdate: false });
            await tempSb.login(token);
            const guild = await tempSb.guilds.fetch(i.values[0]);
            const channels = guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').map(c => ({ label: c.name.substring(0, 50), value: c.id })).slice(0, 25);
            const menu = new MessageSelectMenu().setCustomId(`sel_chan_${token}`).setPlaceholder('Selecione a Call').addOptions(channels);
            await i.editReply({ content: '📍 Selecione a Call:', components: [new MessageActionRow().addComponents(menu)] });
            tempSb.destroy();
        }

        if (i.customId.startsWith('sel_chan_')) {
            await supabase.from('users').upsert({
                discord_id: i.user.id,
                user_token: encrypt(token),
                target_channel: i.values[0]
            });
            await i.editReply({ content: '✅ Configurado!', components: [] });
        }
    }
});

manager.login(process.env.BOT_TOKEN);