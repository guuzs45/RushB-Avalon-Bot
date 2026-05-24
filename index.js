// sistema atualizado

require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    PermissionsBitField,
    SlashCommandBuilder,
    Routes,
    REST
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
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const monitoredChannels = [
    process.env.VOICE_CHANNEL_1,
    process.env.VOICE_CHANNEL_2
];

const PROTECTED_ROLES = [
    '1504501768011124917', // Staff
    '1504502396766650570'  // Caller
];

const RAID_HELPER_ID = '579155972115660803';

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS activity (
            userId TEXT PRIMARY KEY,
            lastActivity INTEGER
        )
    `);
});

function updateActivity(userId) {

    db.run(`
        INSERT OR REPLACE INTO activity(userId, lastActivity)
        VALUES (?, ?)
    `, [userId, Date.now()]);
}

async function executarLimpeza(guild) {

    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);

    const members = await guild.members.fetch();

    const limite = Date.now() - (7 * 24 * 60 * 60 * 1000);

    let removidos = 0;

    for (const member of members.values()) {

        if (member.user.bot) continue;

        if (
            member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) continue;

        const hasProtectedRole = member.roles.cache.some(role =>
            PROTECTED_ROLES.includes(role.id)
        );

        if (hasProtectedRole) continue;

        const row = await new Promise(resolve => {

            db.get(`
                SELECT lastActivity
                FROM activity
                WHERE userId = ?
            `, [member.id], (err, row) => {

                if (err) {

                    console.error(err);

                    return resolve(null);
                }

                resolve(row);
            });
        });

        const ultima = row?.lastActivity || 0;

        if (ultima < limite) {

            try {

                const rolesToRemove = member.roles.cache.filter(role =>
                    role.id !== guild.id &&
                    role.id !== VISITANTE_ROLE_ID
                );

                await member.roles.remove(rolesToRemove);

                await member.roles.add(VISITANTE_ROLE_ID);

                removidos++;

                console.log(`🧹 Limpo: ${member.user.tag}`);

                if (logChannel) {

                    await logChannel.send(
                        `🧹 ${member.user.tag} foi movido para Visitante por inatividade.`
                    );
                }

            } catch (e) {

                console.error(e);
            }
        }
    }

    if (logChannel) {

        await logChannel.send(
            `✅ Limpeza concluída. ${removidos} membros foram limpos.`
        );
    }
}

client.once('clientReady', async () => {

    console.log(`✅ Bot online: ${client.user.tag}`);

    const commands = [

        new SlashCommandBuilder()
            .setName('cleandc')
            .setDescription('Executa limpeza manual'),

        new SlashCommandBuilder()
            .setName('atividade')
            .setDescription('Mostra membros inativos')

    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' })
        .setToken(process.env.TOKEN);

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                client.user.id,
                GUILD_ID
            ),
            { body: commands }
        );

        console.log('✅ Slash commands registrados.');

    } catch (err) {

        console.error(err);
    }
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (
        !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
        )
    ) {

        return interaction.reply({
            content: '❌ Sem permissão.',
            ephemeral: true
        });
    }

    if (interaction.commandName === 'cleandc') {

        await interaction.reply({
            content: '🧹 Executando limpeza manual...',
            ephemeral: true
        });

        const guild = await client.guilds.fetch(GUILD_ID);

        executarLimpeza(guild);
    }

    if (interaction.commandName === 'atividade') {

        const guild = await client.guilds.fetch(GUILD_ID);

        const members = await guild.members.fetch();

        const limite = Date.now() - (7 * 24 * 60 * 60 * 1000);

        let lista = [];

        for (const member of members.values()) {

            if (member.user.bot) continue;

            const hasProtectedRole = member.roles.cache.some(role =>
                PROTECTED_ROLES.includes(role.id)
            );

            if (hasProtectedRole) continue;

            const row = await new Promise(resolve => {

                db.get(`
                    SELECT lastActivity
                    FROM activity
                    WHERE userId = ?
                `, [member.id], (err, row) => {

                    resolve(row);
                });
            });

            const ultima = row?.lastActivity || 0;

            if (ultima < limite) {

                lista.push(member.user.tag);
            }
        }

        if (lista.length === 0) {

            return interaction.reply({
                content: '✅ Nenhum membro inativo.',
                ephemeral: true
            });
        }

        interaction.reply({
            content:
                `📋 Inativos:\n\n${lista.join('\n')}`,
            ephemeral: true
        });
    }
});

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    updateActivity(message.author.id);
});

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

client.on('voiceStateUpdate', async (oldState, newState) => {

    const member = newState.member;

    if (!member || member.user.bot) return;

    updateActivity(member.user.id);

    try {

        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;

        // Entrou em call monitorada
        if (
            monitoredChannels.includes(newChannel) &&
            !member.roles.cache.has(ROLE_ID)
        ) {

            await member.roles.add(ROLE_ID);

            console.log(`✅ Cargo adicionado para ${member.user.tag}`);
        }

        // Saiu da call monitorada
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

// LIMPEZA AUTOMÁTICA A CADA 7 DIAS ÀS 03:00
cron.schedule('0 3 */7 * *', async () => {

    console.log('🧹 Iniciando limpeza automática...');

    const guild = await client.guilds.fetch(GUILD_ID);

    executarLimpeza(guild);
});

client.login(process.env.TOKEN);