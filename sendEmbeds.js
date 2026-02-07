require('dotenv').config();
const { Client, Intents, MessageEmbed } = require('discord.js');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

// IDs dos canais
const CHANNELS = {
    ANUNCIOS: '1469696843779674306',
    REGRAS: '1469696844996022306',
    COMO_USAR: '1469696846375944367'
};

client.once('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}`);

    try {
        // EMBED DE ANÚNCIOS
        const anunciosChannel = await client.channels.fetch(CHANNELS.ANUNCIOS);
        const anunciosEmbed = new MessageEmbed()
            .setColor('#5865F2')
            .setTitle('Anúncios Oficiais')
            .setDescription('**Bem-vindo ao VoxBot Farm System**\n\nEste canal é dedicado a anúncios oficiais e atualizações importantes do sistema.')
            .addField(
                '**O que você encontrará aqui**',
                '**Atualizações do Sistema** - Novas funcionalidades e melhorias\n' +
                '**Manutenções Programadas** - Avisos sobre períodos de manutenção\n' +
                '**Eventos Especiais** - Promoções e eventos de VoxCoins\n' +
                '**Mudanças Importantes** - Alterações nas regras ou sistema'
            )
            .addField(
                '**Notificações**',
                '*Ative as notificações deste canal para não perder nenhuma atualização importante.*'
            )
            .setFooter({ text: 'VoxBot System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await anunciosChannel.send({ embeds: [anunciosEmbed] });
        console.log('✅ Embed de anúncios enviado');

        // EMBED DE REGRAS
        const regrasChannel = await client.channels.fetch(CHANNELS.REGRAS);
        const regrasEmbed = new MessageEmbed()
            .setColor('#ED4245')
            .setTitle('Regras do Servidor')
            .setDescription('**Leia atentamente as regras antes de utilizar o sistema**\n\nO não cumprimento das regras pode resultar em punições.')
            .addField(
                '**1. Uso Responsável**',
                'Utilize o sistema de farm de forma responsável e ética. *Não abuse do sistema ou tente burlá-lo.*'
            )
            .addField(
                '**2. Contas Pessoais**',
                'Use apenas **sua própria conta** do Discord. *Compartilhamento de contas é proibido e resultará em banimento.*'
            )
            .addField(
                '**3. Respeito à Comunidade**',
                'Mantenha o respeito com todos os membros. *Comportamento tóxico, assédio ou spam não serão tolerados.*'
            )
            .addField(
                '**4. Segurança da Conta**',
                '**Nunca compartilhe seu token** com outras pessoas. *A equipe do VoxBot nunca pedirá seu token em mensagens privadas.*'
            )
            .addField(
                '**5. Farming Legítimo**',
                'O tempo de farm deve ser **real e legítimo**. *Uso de bots, macros ou automação para simular presença é proibido.*'
            )
            .addField(
                '**6. Recompensas**',
                'As recompensas são **pessoais e intransferíveis** (exceto quando permitido pelo sistema). *Tentativas de fraude resultarão em perda de VoxCoins e possível banimento.*'
            )
            .addField(
                '**Punições**',
                '**Advertência** - Primeira infração leve\n' +
                '**Suspensão Temporária** - Infrações repetidas ou moderadas\n' +
                '**Banimento Permanente** - Infrações graves ou fraude\n\n' +
                '*A equipe se reserva o direito de aplicar punições conforme a gravidade da situação.*'
            )
            .setFooter({ text: 'Última atualização', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await regrasChannel.send({ embeds: [regrasEmbed] });
        console.log('✅ Embed de regras enviado');

        // EMBED DE COMO USAR
        const comoUsarChannel = await client.channels.fetch(CHANNELS.COMO_USAR);
        const comoUsarEmbed = new MessageEmbed()
            .setColor('#57F287')
            .setTitle('Como Usar o VoxBot')
            .setDescription('**Guia completo para começar a farmar VoxCoins**\n\nSiga os passos abaixo para configurar sua conta e começar a ganhar recompensas.')
            .addField(
                '**Passo 1: Gerar Token Único**',
                'Acesse o canal de **setup** e clique no botão **"Gerar Token"**.\n' +
                '*Você receberá um token único que será usado para acessar sua conta no sistema.*\n' +
                '*Guarde este token com segurança - você precisará dele para fazer login.*'
            )
            .addField(
                '**Passo 2: Configurar Conta**',
                'Clique no botão **"Configurar Conta"** e forneça:\n' +
                '**Token Único** - O token que você gerou no passo 1\n' +
                '**Token do Discord** - Seu token pessoal do Discord\n\n' +
                '*Como obter seu token do Discord:*\n' +
                '1. Abra o Discord no navegador\n' +
                '2. Pressione **F12** para abrir o Console\n' +
                '3. Vá na aba **Console**\n' +
                '4. Cole o código fornecido no suporte\n' +
                '5. Copie o token exibido'
            )
            .addField(
                '**Passo 3: Selecionar Servidor e Canal**',
                'Após configurar sua conta:\n' +
                '1. **Selecione o servidor** onde deseja farmar\n' +
                '2. **Escolha o canal de voz** para entrar automaticamente\n' +
                '3. O sistema iniciará automaticamente'
            )
            .addField(
                '**Como Funciona o Farm**',
                '**Ganho de VoxCoins** - Você ganha **1 VoxCoin a cada 5 minutos** em call\n' +
                '**Automático** - O bot entra e permanece no canal automaticamente\n' +
                '**Rastreamento** - Todo o tempo é registrado e convertido em moedas\n\n' +
                '*Mantenha-se conectado para maximizar seus ganhos!*'
            )
            .addField(
                '**Comandos Úteis**',
                '**`/saldo`** - Verifique quantos VoxCoins você possui\n' +
                '**`/ranking`** - Veja os maiores farmers do servidor\n' +
                '**`/loja`** - Navegue pelas recompensas disponíveis\n' +
                '**`/comprar`** - Adquira recompensas com seus VoxCoins\n' +
                '**`/historico`** - Consulte seu histórico de transações'
            )
            .addField(
                '**Dicas Importantes**',
                '**Segurança** - *Nunca compartilhe seu token com ninguém*\n' +
                '**Estabilidade** - *Mantenha uma conexão estável para evitar desconexões*\n' +
                '**Suporte** - *Em caso de problemas, abra um ticket no canal de suporte*\n' +
                '**Atualizações** - *Fique atento aos anúncios para novidades e eventos*'
            )
            .setFooter({ text: 'Precisa de ajuda? Abra um ticket no canal de suporte', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await comoUsarChannel.send({ embeds: [comoUsarEmbed] });
        console.log('✅ Embed de como usar enviado');

        console.log('\n🎉 Todos os embeds foram enviados com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao enviar embeds:', error);
        process.exit(1);
    }
});

client.login(process.env.BOT_TOKEN);
