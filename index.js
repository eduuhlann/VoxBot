require('dotenv').config();
const { Client: Manager, Intents, MessageEmbed, MessageActionRow, MessageButton, Modal, TextInputComponent } = require('discord.js');
const { Client: Selfbot, RichPresence } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');
const db = require('./database');
const { decrypt } = require('./security');

const manager = new Manager({ intents: [32767] }); // All Intents
const sessions = new Map();

async function startFarm(userId) {
    const user = await db.prepare().get(userId);
    if (!user?.user_token) return;

    if (sessions.has(userId)) sessions.get(userId).destroy();

    const sb = new Selfbot({ checkUpdate: false });

    sb.on('ready', async () => {
        console.log(`✅ Farm Online: ${sb.user.tag}`);
        const channel = await sb.channels.fetch(user.target_channel).catch(() => null);
        if (!channel) return;

        joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfMute: true
        });

        const rpc = new RichPresence(sb)
            .setApplicationId(process.env.RPC_APP_ID)
            .setName(user.rpc_name || 'VoxBot')
            .setDetails(user.rpc_details || 'Farming...')
            .setState(user.rpc_state || 'Ativo')
            .setStartTimestamp(Date.now());

        if (user.rpc_large_image) {
            // "Pulo do gato": Timestamp para limpar cache do Discord
            const img = `${user.rpc_large_image.split('?')[0]}?v=${Date.now()}`;
            const [asset] = await RichPresence.getExternal(sb, process.env.RPC_APP_ID, img);
            rpc.setAssetsLargeImage(asset?.external_asset_path || img);
        }
        sb.user.setActivity(rpc);
    });

    sb.login(decrypt(user.user_token)).then(() => sessions.set(userId, sb));
}

manager.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // Comando !editar com upload
    if (msg.content === '!editar' && msg.attachments.size > 0) {
        const url = msg.attachments.first().url;
        await db.prepare('UPDATE users SET rpc_large_image').run(url, msg.author.id);
        msg.reply('📸 Imagem salva! Reinicie o farm para aplicar.');
    }

    // Painel principal
    if (msg.content === '!setup') {
        const row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('btn_edit').setLabel('Configurar').setStyle('PRIMARY'),
            new MessageButton().setCustomId('btn_start').setLabel('Ligar').setStyle('SUCCESS'),
            new MessageButton().setCustomId('btn_stop').setLabel('Desligar').setStyle('DANGER')
        );
        msg.channel.send({ content: '⚙️ **Painel VoxBot**', components: [row] });
    }
});

manager.on('interactionCreate', async (i) => {
    if (i.isButton()) {
        if (i.customId === 'btn_start') {
            await i.deferReply({ ephemeral: true });
            startFarm(i.user.id);
            i.editReply('🚀 Iniciado!');
        }
        if (i.customId === 'btn_stop') {
            sessions.get(i.user.id)?.destroy();
            sessions.delete(i.user.id);
            i.reply({ content: '🛑 Parado.', ephemeral: true });
        }
        if (i.customId === 'btn_edit') {
            const modal = new Modal().setCustomId('mdl_rpc').setTitle('RPC');
            modal.addComponents(
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('n').setLabel('Nome').setStyle('SHORT')),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('d').setLabel('Detalhes').setStyle('SHORT')),
                new MessageActionRow().addComponents(new TextInputComponent().setCustomId('s').setLabel('Estado').setStyle('SHORT'))
            );
            await i.showModal(modal);
        }
    }
    if (i.isModalSubmit() && i.customId === 'mdl_rpc') {
        await i.deferReply({ ephemeral: true }); // Deferir para não dar timeout

        const name = i.fields.getTextInputValue('n');
        const details = i.fields.getTextInputValue('d');
        const state = i.fields.getTextInputValue('s');

        // Chama a função run que corrigimos acima
        await db.prepare().run(name, details, state, i.user.id);

        i.editReply({ content: '✅ Configurações de texto salvas!', ephemeral: true });
    }
});