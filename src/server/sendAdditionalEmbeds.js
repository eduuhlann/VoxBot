require('dotenv').config();
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

// IDs dos canais
const CHANNELS = {
    RANKING: '1469696848779280607',
    STATS: '1469696852764131449',
    SUPORTE: '1469696864168317152',
    BUG: '1469696865824936088',
    CHAT_GERAL: '1469696867720892577'
};

client.once('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}`);

    try {
        // EMBED DO RANKING
        const rankingChannel = await client.channels.fetch(CHANNELS.RANKING);
        const rankingEmbed = new MessageEmbed()
            .setColor('#FEE75C')
            .setTitle('Ranking de Farmers')
            .setDescription('**Veja quem está farmando mais horas em call**\n\nCompare seu progresso com outros membros da comunidade.')
            .addField(
                '**Como Funciona**',
                'O sistema rastreia automaticamente o **tempo total** que você passa em calls de voz.\n' +
                'Quanto mais tempo em call, maior sua posição no ranking.\n\n' +
                '*Use o comando `/ranking` para ver os top farmers do servidor.*'
            )
            .addField(
                '**Informações do Ranking**',
                '**Posição** - Sua classificação entre todos os farmers\n' +
                '**Tempo Total** - Horas acumuladas em calls\n' +
                '**Top 10** - Os maiores farmers do servidor\n' +
                '**Atualização** - Ranking atualizado em tempo real'
            )
            .addField(
                '**Comandos Úteis**',
                '**`/ranking`** - Ver o ranking completo\n' +
                '**`/stats`** - Ver suas estatísticas pessoais\n' +
                '**`/tempo`** - Verificar seu tempo acumulado'
            )
            .addField(
                '**Dicas**',
                '*Mantenha-se conectado para subir no ranking*\n' +
                '*Conexão estável evita perda de tempo rastreado*\n' +
                '*Eventos especiais podem dar bônus de tempo*'
            )
            .setFooter({ text: 'VoxBot Ranking System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await rankingChannel.send({ embeds: [rankingEmbed] });
        console.log('✅ Embed do ranking enviado');

        // EMBED DE ESTATÍSTICAS
        const statsChannel = await client.channels.fetch(CHANNELS.STATS);
        const statsEmbed = new MessageEmbed()
            .setColor('#57F287')
            .setTitle('Estatísticas de Farm')
            .setDescription('**Acompanhe seu progresso e tempo em calls**\n\nVeja suas estatísticas detalhadas de farming.')
            .addField(
                '**Como Consultar**',
                'Use o comando **`/stats`** para ver:\n' +
                '**Tempo Total** - Horas acumuladas em calls\n' +
                '**Tempo Hoje** - Quanto você farmou hoje\n' +
                '**Tempo Esta Semana** - Farm dos últimos 7 dias\n' +
                '**Tempo Este Mês** - Total do mês atual\n' +
                '**Posição no Ranking** - Sua classificação entre os farmers'
            )
            .addField(
                '**Rastreamento**',
                'O sistema rastreia automaticamente todo o tempo que você passa em calls.\n' +
                'As estatísticas são atualizadas em **tempo real**.\n\n' +
                '*Mantenha-se conectado para acumular mais horas!*'
            )
            .addField(
                '**Comandos Úteis**',
                '**`/stats`** - Ver suas estatísticas completas\n' +
                '**`/ranking`** - Comparar com outros farmers\n' +
                '**`/tempo`** - Ver tempo total acumulado\n' +
                '**`/historico`** - Ver histórico de sessões'
            )
            .setFooter({ text: 'VoxBot Stats System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await statsChannel.send({ embeds: [statsEmbed] });
        console.log('✅ Embed de estatísticas enviado');

        // EMBED DE SUPORTE (com botão)
        const suporteChannel = await client.channels.fetch(CHANNELS.SUPORTE);
        const suporteEmbed = new MessageEmbed()
            .setColor('#5865F2')
            .setTitle('Suporte VoxBot')
            .setDescription('**Precisa de ajuda? Abra um ticket de suporte**\n\nNossa equipe está pronta para ajudar você.')
            .addField(
                '**Quando Abrir um Ticket**',
                '**Problemas Técnicos** - Erros ao configurar ou usar o bot\n' +
                '**Dúvidas sobre o Sistema** - Perguntas sobre funcionamento\n' +
                '**Problemas de Rastreamento** - Questões sobre tempo não contabilizado\n' +
                '**Recuperação de Conta** - Problemas de acesso ou login\n' +
                '**Sugestões** - Ideias para melhorar o sistema'
            )
            .addField(
                '**Como Funciona**',
                '1. Clique no botão **"Abrir Ticket"** abaixo\n' +
                '2. Um canal privado será criado para você\n' +
                '3. Descreva seu problema detalhadamente\n' +
                '4. Aguarde a resposta da equipe\n' +
                '5. Quando resolvido, o ticket será fechado\n\n' +
                '*Tickets são privados - apenas você e a equipe podem ver.*'
            )
            .addField(
                '**Tempo de Resposta**',
                '*Normalmente respondemos em até 24 horas.*\n' +
                '*Para problemas urgentes, mencione no ticket.*'
            )
            .setFooter({ text: 'VoxBot Support Team', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const suporteButton = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('open_ticket_suporte')
                    .setLabel('Abrir Ticket')
                    .setStyle('PRIMARY')
            );

        await suporteChannel.send({ embeds: [suporteEmbed], components: [suporteButton] });
        console.log('✅ Embed de suporte enviado');

        // EMBED DE BUG (com botão)
        const bugChannel = await client.channels.fetch(CHANNELS.BUG);
        const bugEmbed = new MessageEmbed()
            .setColor('#ED4245')
            .setTitle('Reportar Bug')
            .setDescription('**Encontrou um problema? Nos ajude a melhorar**\n\nReporte bugs e erros para que possamos corrigi-los rapidamente.')
            .addField(
                '**O que é um Bug?**',
                '**Erro de Funcionamento** - Algo não funciona como deveria\n' +
                '**Comportamento Inesperado** - Sistema age de forma estranha\n' +
                '**Falha de Segurança** - Vulnerabilidades ou exploits\n' +
                '**Problemas de Performance** - Lentidão ou travamentos\n' +
                '**Erros Visuais** - Problemas de exibição ou formatação'
            )
            .addField(
                '**Como Reportar**',
                '1. Clique no botão **"Reportar Bug"** abaixo\n' +
                '2. Descreva o problema detalhadamente\n' +
                '3. Inclua **passos para reproduzir** o erro\n' +
                '4. Adicione **prints ou vídeos** se possível\n' +
                '5. Mencione quando o problema começou\n\n' +
                '*Quanto mais detalhes, mais rápido conseguimos corrigir!*'
            )
            .addField(
                '**Informações Úteis**',
                'Ao reportar, tente incluir:\n' +
                '**Sistema Operacional** - Windows, Mac, Linux, Mobile\n' +
                '**Navegador/App** - Chrome, Discord Desktop, etc\n' +
                '**Mensagem de Erro** - Se houver, copie exatamente\n' +
                '**Horário** - Quando o bug ocorreu'
            )
            .setFooter({ text: 'VoxBot Bug Report System', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const bugButton = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('open_ticket_bug')
                    .setLabel('Reportar Bug')
                    .setStyle('DANGER')
            );

        await bugChannel.send({ embeds: [bugEmbed], components: [bugButton] });
        console.log('✅ Embed de bug enviado');

        // EMBED DO CHAT GERAL
        const chatChannel = await client.channels.fetch(CHANNELS.CHAT_GERAL);
        const chatEmbed = new MessageEmbed()
            .setColor('#9B59B6')
            .setTitle('Chat Geral')
            .setDescription('**Bem-vindo ao chat da comunidade VoxBot**\n\nConverse, faça amizades e compartilhe experiências.')
            .addField(
                '**Regras do Chat**',
                '**Respeito** - Trate todos com educação e cordialidade\n' +
                '**Sem Spam** - Evite mensagens repetitivas ou flood\n' +
                '**Sem Flood** - Não envie muitas mensagens seguidas\n' +
                '**Conteúdo Apropriado** - Mantenha conversas adequadas\n' +
                '**Sem Publicidade** - Não divulgue links ou servidores sem permissão'
            )
            .addField(
                '**Tópicos Permitidos**',
                '*Conversas gerais sobre qualquer assunto*\n' +
                '*Discussões sobre o VoxBot e sistema de farm*\n' +
                '*Compartilhar conquistas e progresso*\n' +
                '*Fazer perguntas à comunidade*\n' +
                '*Conhecer outros membros*'
            )
            .addField(
                '**Dicas de Convivência**',
                '**Seja Amigável** - *Cumprimente novos membros*\n' +
                '**Ajude Outros** - *Compartilhe conhecimento*\n' +
                '**Evite Discussões** - *Mantenha debates saudáveis*\n' +
                '**Divirta-se** - *Este é um espaço para todos*'
            )
            .setFooter({ text: 'VoxBot Community', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        await chatChannel.send({ embeds: [chatEmbed] });
        console.log('✅ Embed do chat geral enviado');

        console.log('\n🎉 Todos os embeds foram enviados com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao enviar embeds:', error);
        process.exit(1);
    }
});

client.login(process.env.BOT_TOKEN);
