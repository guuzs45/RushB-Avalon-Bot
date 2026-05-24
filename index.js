require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    PermissionsBitField
} = require('discord.js');

const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction
    ]
});

const ROLE_ID = process.env.ROLE_ID;

const VISITANTE_ROLE_ID = process.env.VISITANTE_ROLE_ID;

const GUILD_ID = process.env.GUILD_ID;

const monitoredChannels = [
    process.env.VOICE_CHANNEL_1,
    process.env.VOICE_CHANNEL_2
];

// CARGOS PROTEGIDOS
const PROTECTED_ROLES = [
    '1504501768011124917', // Staff
    '1504502396766650570'  // Caller
];

// ID OFICIAL RAID HELPER
const RAID_HELPER_ID = '579155972115660803';

const db = new sqlite3.Database('./database.sqlite');

db.run(`
CREATE TABLE IF NOT EXISTS activity (
    userId TEXT PRIMARY KEY,
    lastActivity INTEGER
)
`);

function updateActivity(userId) {

    db.run(`
        INSERT OR REPLACE INTO activity(userId, lastActivity)
        VALUES (?, ?)
    `, [userId, Date.now()]);
}

client.once('ready', () => {

    console.log(`✅ Bot online: ${client.user.tag}`);
});

//
// MENSAGENS
//

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    updateActivity(message.author.id);
});

//
// REAÇÕES RAID HELPER
//

client.on('messageReactionAdd', async (reaction, user) => {

    try {

        if (user.bot) return;

        if (reaction.partial) {
            await reaction.fetch();
        }

        const message = reaction.message;

        if (message.author.id === RAID_HELPER_ID) {

            updateActivity(user.id);

            console.log(`🎯 Reação RH: ${user.tag}`);
        }

    } catch (err) {

        console.error(err);
    }
});

//
// VOICE + ROLE EXISTENTE
//

client.on('voiceStateUpdate', async (oldState, newState) => {

    const member = newState.member;

    if (!member || member.user.bot) return;

    updateActivity(member.user.id);

    try {

        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;

        // Entrou nas calls monitoradas
        if (
            monitoredChannels.includes(newChannel) &&
            !member.roles.cache.has(ROLE_ID)
        ) {

            await member.roles.add(ROLE_ID);

            console.log(`✅ Cargo adicionado para ${member.user.tag}`);
        }

        // Saiu das calls monitoradas
        if (
            monitoredChannels.includes(oldChannel) &&
            !monitoredChannels.includes(newChannel)
        ) {

            await member.roles.remove(ROLE_ID);

            console.log(`❌ Cargo removido de ${member.user.tag}`);
        }

    } catch (err) {

        console.error(err);
    }
});

//
// LIMPEZA AUTOMÁTICA
//

cron.schedule('0 3 */14 * *', async () => {

    console.log('🧹 Iniciando limpeza automática...');

    try {

        const guild = await client.guilds.fetch(GUILD_ID);

        const members = await guild.members.fetch();

        const limite = Date.now() - (14 * 24 * 60 * 60 * 1000);

        members.forEach(member => {

            if (member.user.bot) return;

            // ADMINISTRADOR
            if (
                member.permissions.has(
                    PermissionsBitField.Flags.Administrator
                )
            ) return;

            // CARGOS PROTEGIDOS
            const hasProtectedRole = member.roles.cache.some(role =>
                PROTECTED_ROLES.includes(role.id)
            );

            if (hasProtectedRole) return;

            db.get(`
                SELECT lastActivity
                FROM activity
                WHERE userId = ?
            `, [member.id], async (err, row) => {

                if (err) return;

                const ultima = row?.lastActivity || 0;

                if (ultima < limite) {

                    try {

                        const rolesToRemove = member.roles.cache.filter(role =>
                            role.id !== guild.id &&
                            role.id !== VISITANTE_ROLE_ID
                        );

                        await member.roles.remove(rolesToRemove);

                        await member.roles.add(VISITANTE_ROLE_ID);

                        console.log(`🧹 Limpo: ${member.user.tag}`);

                    } catch (e) {

                        console.log(`Erro ao limpar ${member.user.tag}`);

                        console.error(e);
                    }
                }
            });
        });

    } catch (err) {

        console.error(err);
    }
});

client.login(process.env.TOKEN);
