require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

const ROLE_ID = process.env.ROLE_ID;

const monitoredChannels = [
    process.env.VOICE_CHANNEL_1,
    process.env.VOICE_CHANNEL_2
];

client.once('ready', () => {
    console.log(`✅ Bot online: ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {

    const member = newState.member;

    if (!member) return;

    try {

        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;

        // Entrou em call monitorada
        if (
            monitoredChannels.includes(newChannel) &&
            !member.roles.cache.has(ROLE_ID)
        ) {

            await member.roles.add(ROLE_ID);

            console.log(
                `✅ Cargo adicionado para ${member.user.tag}`
            );
        }

        // Saiu das calls monitoradas
        if (
            monitoredChannels.includes(oldChannel) &&
            !monitoredChannels.includes(newChannel)
        ) {

            await member.roles.remove(ROLE_ID);

            console.log(
                `❌ Cargo removido de ${member.user.tag}`
            );
        }

    } catch (err) {
        console.error(err);
    }
});

client.login(process.env.TOKEN);