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

// ALTERE ESTA DATA SEMPRE QUE FIZER UM NOVO RESET/REDEPLOY GRANDE
const DEPLOY_DATE = new Date('2026-05-24T00:00:00');

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS activity (
            userId TEXT PRIMARY KEY,
            lastActivity INTEGER,
            interactions INTEGER DEFAULT 0
        )
    `);
});

function formatarData(timestamp) {

    if (!timestamp) return 'Sem atividade';

    return new Date(timestamp).toLocaleDateString('pt-BR');
}

function updateActivity(userId) {

    db.get(`
        SELECT interactions
        FROM activity
        WHERE userId = ?
    `, [userId], (err, row) => {

        const interactions = (row?.interactions || 0) + 1;

        db.run(`
            INSERT OR REPLACE INTO activity(
                userId,
                lastActivity,
                interactions
            )
            VALUES (?, ?, ?)
        `, [
            userId,
            Date.now(),
            interactions
        ]);
    });
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
                SELECT *
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

        const ultima =
            row?.lastActivity ||
            member.joinedTimestamp ||
            Date.now();

        // PROTEÇÃO DE REDEPLOY
        const diasDesdeDeploy =
            (Date.now() - DEPLOY_DATE.getTime()) /
            (1000 * 60 * 60 * 24);

        const protegerSemAtividade =
            !row?.lastActivity &&
            diasDesdeDeploy < 5;

        if (protegerSemAtividade) continue;

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
                        `🧹 ${member.user.tag} foi movido para Visitante.\n📅 Última atividade: ${formatarData(ultima)}`
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
            .setDescription('Mostra relatório de atividade')

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

        let inativos = [];
        let ativos = [];

        for (const member of members.values()) {

            if (member.user.bot) continue;

            const hasProtectedRole = member.roles.cache.some(role =>
                PROTECTED_ROLES.includes(role.id)
            );

            if (hasProtectedRole) continue;

            const row = await new Promise(resolve => {

                db.get(`
                    SELECT *
                    FROM activity
                    WHERE userId = ?
                `, [member.id], (err, row) => {

                    resolve(row);
                });
            });

            const ultima =
                row?.lastActivity ||
                member.joinedTimestamp ||
                Date.now();

            const interactions = row?.interactions || 0;

            if (interactions > 0) {

                ativos.push({
                    user: member.user.tag,
                    nome: member.displayName,
                    total: interactions,
                    ultima: ultima
                });
            }

            if (ultima < limite) {

                inativos.push(
                    `• ${member.user.tag} → ${member.displayName} | ${formatarData(ultima)}`
                );
            }
        }

        ativos.sort((a, b) => b.total - a.total);

        const rankingAtivos = ativos
            .map((a, index) => {

                let posicao;

                if (index === 0) posicao = '🥇';
                else if (index === 1) posicao = '🥈';
                else if (index === 2) posicao = '🥉';
                else posicao = `${index + 1}.`;

                return `${posicao} ${a.user} • ${a.nome} • ${a.total} | 📅 ${formatarData(a.ultima)}`;
            });

        let resposta =
`📊 Relatório de Atividade

🟢 Ranking de Atividade
${rankingAtivos.join('\n')}
`;

        if (inativos.length > 0) {

            resposta += `

🔴 Inativos há mais de 7 dias
${inativos.join('\n')}
`;
        }

        interaction.reply({
            content: resposta,
            ephemeral: true
        });
    }
});

// ATIVIDADE APENAS EM REAÇÕES DO RAID HELPER
client.on('messageReactionAdd', async (reaction, user) => {

    try {

        if (user.bot) return;

        if (reaction.partial) {
            await reaction.fetch();
        }

        const message = reaction.message;

        const isRaidHelper =
            message.author.id === RAID_HELPER_ID ||
            message.webhookId ||
            message.embeds.length > 0;

        if (isRaidHelper) {

            updateActivity(user.id);

            console.log(`🎯 Reação RH: ${user.tag}`);
        }

    } catch (err) {

        console.error(err);
    }
});

// ATIVIDADE APENAS EM CALLS
client.on('voiceStateUpdate', async (oldState, newState) => {

    const member = newState.member;

    if (!member || member.user.bot) return;

    // REGISTRA ATIVIDADE EM QUALQUER CALL
    if (oldState.channelId !== newState.channelId) {

        updateActivity(member.user.id);
    }

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

// VERIFICA TODOS OS DIAS ÀS 05:00 - HORÁRIO DE SÃO PAULO
cron.schedule('0 5 * * *', async () => {

    console.log('🧹 Iniciando verificação automática...');

    const guild = await client.guilds.fetch(GUILD_ID);

    executarLimpeza(guild);

}, {
    timezone: 'America/Sao_Paulo'
});

client.login(process.env.TOKEN);