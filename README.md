# VoxBot - Call Farming System

Este é um sistema de bot duplo (Manager + Selfbot) para farmar horas em chamadas de voz.

## Configuração

1.  **Instalação**:
    Execute `npm install` na pasta do projeto.

2.  **Configuração do Ambiente**:
    Renomeie o arquivo `.env` e preencha as variáveis:
    -   `BOT_TOKEN`: O token do seu Bot Gerenciador (discord.js).
    -   `OWNER_ID`: Seu ID de usuário do Discord (para usar o comando `!setup`).
    -   `RPC_APP_ID`: (Opcional) ID da Aplicação no Discord Developer Portal para a imagem "VoxBot" no Rich Presence.

3.  **Iniciar o Bot**:
    Execute `node src/index.js`.

## Uso

1.  No canal desejado, digite `!setup`.
2.  O Bot enviará um Embed com botões.
3.  **Gerar Token**: Clique para obter sua chave única.
4.  **Configurar Conta**:
    -   Insira o Token Único gerado.
    -   Insira o **Token do Usuário** (Sua conta pessoal).
5.  O bot validará a conta e pedirá para selecionar o **Servidor**.
6.  Em seguida, selecione o **Canal de Voz**.
7.  Pronto! O sistema iniciará o farm automaticamente e mostrará o Rich Presence configurado.

## Aviso Legal

O uso de "Selfbots" (automação de contas de usuário) viola os Termos de Serviço do Discord. Use por sua conta e risco. Este projeto é para fins educacionais.
