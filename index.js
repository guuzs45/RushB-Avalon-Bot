```javascript
require('dotenv').config();

const {

    Client,
    GatewayIntentBits,
    Partials,
    PermissionsBitField,
    SlashCommandBuilder,
    Routes,
    REST,
    EmbedBuilder

} = require(
    'discord.js'
);

const {

    GoogleSpreadsheet

} = require(
    'google-spreadsheet'
);

const {

    JWT

} = require(
    'google-auth-library'
);

const cron =
    require('node-cron');

const {

    executarRegistroDG,
    processarModalDG,
    abrirModalMetter,
    processarMetter

} = require(
    './commands/registrardg'
);

const serviceAccount =
    JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT
    );

const client =
    new Client({

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

const ROLE_ID =
    process.env.ROLE_ID;

const VISITANTE_ROLE_ID =
    process.env.VISITANTE_ROLE_ID;

const GUILD_ID =
    process.env.GUILD_ID;

const LOG_CHANNEL_ID =
    process.env.LOG_CHANNEL_ID;

const monitoredChannels = [

    process.env.VOICE_CHANNEL_1,
    process.env.VOICE_CHANNEL_2
];

const PROTECTED_ROLES = [

    '1504501768011124917',
    '1504502396766650570'
];

const RAID_HELPER_ID =
    '579155972115660803';

const ABSENCE_EMOJI_ID =
    '612343589070045200';

const UNREGISTER_EMOJI_ID =
    '579506704518217739';

const IGNORED_VOICE_CHANNEL =
    '1504505761366282372';

const DEPLOY_DATE =
    new Date(
        '2026-05-25T00:00:00'
    );

const voiceSessions =
    new Map();

const raidParticipations =
    new Map();

const serviceAccountAuth =
    new JWT({

        email:
            serviceAccount.client_email,

        key:
            serviceAccount.private_key,

        scopes: [

            'https://www.googleapis.com/auth/spreadsheets'
        ]
    });

const doc =
    new GoogleSpreadsheet(

        process.env.SHEET_ID,
        serviceAccountAuth
    );

let sheet;

async function iniciarSheets() {

    await doc.loadInfo();

    sheet =
        doc.sheetsByIndex[0];

    console.log(
        '✅ Google Sheets conectado.'
    );
}

function formatarData(
    timestamp
) {

    if (!timestamp)
        return 'Sem atividade';

    return new Date(
        Number(timestamp)
    ).toLocaleDateString(
        'pt-BR'
    );
}

async function buscarUsuario(
    userId
) {

    const rows =
        await sheet.getRows();

    return rows.find(

        r =>
            r.get('userId') ===
            userId
    );
}

async function updateActivity(
    member,
    type = 'general'
) {

    const row =
        await buscarUsuario(
            member.id
        );

    const hoje =
        new Date()
            .toLocaleDateString(
                'pt-BR'
            );

    if (row) {

        const ultimaCall =
            row.get(
                'lastCallDate'
            );

        const interactions =
            Number(

                row.get(
                    'interactions'
                ) || 0
            );

        if (

            type === 'call' &&
            ultimaCall === hoje
        ) {

            console.log(

                `⛔ ${member.user.tag} já recebeu ponto de call hoje.`
            );

            return;
        }

        row.set(
            'userTag',
            member.user.tag
        );

        row.set(
            'displayName',
            member.displayName
        );

        row.set(
            'interactions',
            interactions + 1
        );

        row.set(
            'lastActivity',
            Date.now()
        );

        if (
            type === 'call'
        ) {

            row.set(
                'lastCallDate',
                hoje
            );
        }

        await row.save();

    } else {

        await sheet.addRow({

            userId:
                member.id,

            userTag:
                member.user.tag,

            displayName:
                member.displayName,

            interactions:
                1,

            lastActivity:
                Date.now(),

            lastCallDate:
                type === 'call'
                    ? hoje
                    : ''
        });
    }
}

async function removerParticipacao(
    member
) {

    const row =
        await buscarUsuario(
            member.id
        );

    if (!row)
        return;

    const atual =
        Number(

            row.get(
                'interactions'
            ) || 0
        );

    row.set(

        'interactions',

        Math.max(
            atual - 1,
            0
        )
    );

    await row.save();
}

async function executarLimpeza(
    guild
) {

    const logChannel =
        guild.channels.cache.get(
            LOG_CHANNEL_ID
        );

    const members =
        await guild.members.fetch();

    const limite =
        Date.now() -
        (
            7 *
            24 *
            60 *
            60 *
            1000
        );

    let removidos = 0;

    for (
        const member of
        members.values()
    ) {

        if (
            member.user.bot
        )
            continue;

        if (

            member.permissions.has(
                PermissionsBitField
                    .Flags
                    .Administrator
            )
        ) continue;

        const hasProtectedRole =
            member.roles.cache.some(

                role =>
                    PROTECTED_ROLES.includes(
                        role.id
                    )
            );

        if (
            hasProtectedRole
        )
            continue;

        const row =
            await buscarUsuario(
                member.id
            );

        const ultima =
            row?.get(
                'lastActivity'
            ) ||

            member.joinedTimestamp ||
            Date.now();

        const diasDesdeDeploy =
            (

                Date.now() -
                DEPLOY_DATE.getTime()

            ) /

            (
                1000 *
                60 *
                60 *
                24
            );

        const protegerSemAtividade =
            !row &&
            diasDesdeDeploy < 5;

        if (
            protegerSemAtividade
        )
            continue;

        if (
            ultima < limite
        ) {

            try {

                const rolesToRemove =
                    member.roles.cache.filter(

                        role =>

                            role.id !== guild.id &&
                            role.id !== VISITANTE_ROLE_ID
                    );

                await member.roles.remove(
                    rolesToRemove
                );

                await member.roles.add(
                    VISITANTE_ROLE_ID
                );

                removidos++;

                if (
                    logChannel
                ) {

                    const rolesRemovidas =
                        rolesToRemove

                            .map(
                                r => `• ${r.name}`
                            )

                            .join('\n');

                    const embed =
                        new EmbedBuilder()

                            .setColor(
                                '#ff0000'
                            )

                            .setTitle(
                                '🧹 Limpeza Automática'
                            )

                            .addFields(

                                {

                                    name:
                                        '👤 Usuário',

                                    value:
                                        member.user.tag
                                },

                                {

                                    name:
                                        '🏷️ Apelido',

                                    value:
                                        member.displayName
                                },

                                {

                                    name:
                                        '📅 Última atividade',

                                    value:
                                        formatarData(
                                            ultima
                                        )
                                },

                                {

                                    name:
                                        '🗑️ Tags removidas',

                                    value:
                                        rolesRemovidas ||
                                        'Nenhuma'
                                }
                            )

                            .setTimestamp();

                    await logChannel.send({
                        embeds: [embed]
                    });
                }

            } catch (e) {

                console.error(e);
            }
        }
    }

    if (
        logChannel
    ) {

        await logChannel.send(

            `✅ Limpeza concluída. ${removidos} membros foram limpos.`
        );
    }
}

client.once(

    'clientReady',

    async () => {

        console.log(

            `✅ Bot online: ${client.user.tag}`
        );

        await iniciarSheets();

        const commands = [

            new SlashCommandBuilder()

                .setName(
                    'cleandc'
                )

                .setDescription(
                    'Executa limpeza manual'
                ),

            new SlashCommandBuilder()

                .setName(
                    'atividade'
                )

                .setDescription(
                    'Mostra relatório de atividade'
                ),

            new SlashCommandBuilder()

                .setName(
                    'registrardg'
                )

                .setDescription(
                    'Registrar DG'
                )

        ].map(
            command =>
                command.toJSON()
        );

        const rest =
            new REST({

                version: '10'
            }).setToken(
                process.env.TOKEN
            );

        await rest.put(

            Routes.applicationGuildCommands(

                client.user.id,
                GUILD_ID
            ),

            {
                body: commands
            }
        );

        console.log(
            '✅ Slash commands registrados.'
        );
    }
);

client.on(

    'interactionCreate',

    async interaction => {

        // BOTÃO
        if (
            interaction.isButton()
        ) {

            if (

                interaction.customId ===
                'enviar_metter'
            ) {

                return abrirModalMetter(
                    interaction
                );
            }
        }

        // MODAIS
        if (
            interaction.isModalSubmit()
        ) {

            if (

                interaction.customId ===
                'registrar_dg_modal'
            ) {

                return processarModalDG(
                    interaction
                );
            }

            if (

                interaction.customId ===
                'metter_modal'
            ) {

                return processarMetter(
                    interaction
                );
            }
        }

        // COMANDOS
        if (
            !interaction.isChatInputCommand()
        ) return;

        // REGISTRAR DG
        if (

            interaction.commandName ===
            'registrardg'
        ) {

            return executarRegistroDG(
                interaction
            );
        }

        // ADMIN
        if (

            !interaction.member.permissions.has(

                PermissionsBitField
                    .Flags
                    .Administrator
            )
        ) {

            return interaction.reply({

                content:
                    '❌ Sem permissão.',

                ephemeral: true
            });
        }

        // CLEAN
        if (

            interaction.commandName ===
            'cleandc'
        ) {

            await interaction.reply({

                content:
                    '🧹 Executando limpeza manual...',

                ephemeral: true
            });

            const guild =
                await client.guilds.fetch(
                    GUILD_ID
                );

            executarLimpeza(
                guild
            );
        }

        // ATIVIDADE
        if (

            interaction.commandName ===
            'atividade'
        ) {

            const guild =
                await client.guilds.fetch(
                    GUILD_ID
                );

            const members =
                await guild.members.fetch();

            const limite =
                Date.now() -

                (
                    7 *
                    24 *
                    60 *
                    60 *
                    1000
                );

            let ativos = [];
            let inativos = [];

            const rows =
                await sheet.getRows();

            for (
                const member of
                members.values()
            ) {

                if (
                    member.user.bot
                )
                    continue;

                const hasProtectedRole =
                    member.roles.cache.some(

                        role =>
                            PROTECTED_ROLES.includes(
                                role.id
                            )
                    );

                if (
                    hasProtectedRole
                )
                    continue;

                const row =
                    rows.find(

                        r =>
                            r.get('userId') ===
                            member.id
                    );

                const ultima =
                    row?.get(
                        'lastActivity'
                    ) ||

                    member.joinedTimestamp ||
                    Date.now();

                const interactions =
                    Number(

                        row?.get(
                            'interactions'
                        ) || 0
                    );

                if (

                    interactions > 0 &&
                    ultima >= limite
                ) {

                    ativos.push({

                        user:
                            member.user.tag,

                        nome:
                            member.displayName,

                        total:
                            interactions,

                        ultima
                    });
                }

                if (
                    ultima < limite
                ) {

                    inativos.push(

                        `• ${member.user.tag} → ${member.displayName}\n└ 📅 ${formatarData(ultima)}`
                    );
                }
            }

            ativos.sort(

                (a, b) =>
                    b.total - a.total
            );

            const ranking =
                ativos.map(

                    (a, index) => {

                        let posicao;

                        if (
                            index === 0
                        )

                            posicao = '🥇';

                        else if (
                            index === 1
                        )

                            posicao = '🥈';

                        else if (
                            index === 2
                        )

                            posicao = '🥉';

                        else

                            posicao =
                                `${index + 1}.`;

                        return `${posicao} ${a.user} • ${a.nome}\n└ ${a.total} participações • 📅 ${formatarData(a.ultima)}`;
                    }
                );

            const embed =
                new EmbedBuilder()

                    .setColor(
                        '#5865F2'
                    )

                    .setTitle(
                        '📊 Relatório de Atividade'
                    )

                    .setDescription(

                        [

                            '## 🟢 Ranking de Atividade',

                            ranking.length > 0
                                ? ranking.join('\n\n')
                                : 'Nenhum ativo.',

                            '',

                            '## 🔴 Inativos',

                            inativos.length > 0
                                ? inativos.join('\n\n')
                                : 'Nenhum inativo.'

                        ].join('\n')
                    )

                    .setFooter({

                        text:
                            'Sistema de atividade Avalon'
                    })

                    .setTimestamp();

            interaction.reply({

                embeds: [embed],

                ephemeral: true
            });
        }
    }
);

client.on(

    'messageReactionAdd',

    async (
        reaction,
        user
    ) => {

        try {

            if (
                user.bot
            )
                return;

            if (
                reaction.partial
            ) {

                await reaction.fetch();
            }

            const message =
                reaction.message;

            const guild =
                message.guild;

            const member =
                await guild.members.fetch(
                    user.id
                );

            const isRaidHelper =

                message.author.id ===
                RAID_HELPER_ID ||

                message.webhookId ||

                message.embeds.length > 0;

            if (
                !isRaidHelper
            ) return;

            const emojiId =
                reaction.emoji.id;

            const participationKey =
                `${message.id}_${user.id}`;

            if (

                emojiId ===
                ABSENCE_EMOJI_ID ||

                emojiId ===
                UNREGISTER_EMOJI_ID
            ) {

                if (

                    raidParticipations.has(
                        participationKey
                    )
                ) {

                    raidParticipations.delete(
                        participationKey
                    );

                    await removerParticipacao(
                        member
                    );
                }

                return;
            }

            if (

                raidParticipations.has(
                    participationKey
                )
            ) {

                return;
            }

            raidParticipations.set(
                participationKey,
                true
            );

            await updateActivity(
                member,
                'rh'
            );

        } catch (err) {

            console.error(err);
        }
    }
);

client.on(

    'voiceStateUpdate',

    async (
        oldState,
        newState
    ) => {

        const member =
            newState.member;

        if (

            !member ||
            member.user.bot
        ) return;

        const oldChannel =
            oldState.channelId;

        const newChannel =
            newState.channelId;

        if (

            !oldChannel &&
            newChannel &&
            newChannel !==
                IGNORED_VOICE_CHANNEL
        ) {

            voiceSessions.set(

                member.id,

                {
                    joinedAt:
                        Date.now()
                }
            );
        }

        if (

            oldChannel &&
            !newChannel &&
            oldChannel !==
                IGNORED_VOICE_CHANNEL
        ) {

            const session =
                voiceSessions.get(
                    member.id
                );

            if (!session)
                return;

            const tempo =
                Date.now() -
                session.joinedAt;

            const minutos =
                tempo /
                1000 /
                60;

            voiceSessions.delete(
                member.id
            );

            const oldChannelObj =
                oldState.guild.channels.cache.get(
                    oldChannel
                );

            const membrosNaCall =

                oldChannelObj?.members.filter(

                    m => !m.user.bot
                ).size || 0;

            const mutado =

                oldState.selfMute ||
                oldState.serverMute;

            const surdo =

                oldState.selfDeaf ||
                oldState.serverDeaf;

            if (

                minutos >= 60 &&
                membrosNaCall >= 2 &&
                !mutado &&
                !surdo
            ) {

                await updateActivity(
                    member,
                    'call'
                );

                console.log(

                    `🎤 Call válida: ${member.user.tag}`
                );
            }
        }

        try {

            if (

                monitoredChannels.includes(
                    newChannel
                ) &&

                !member.roles.cache.has(
                    ROLE_ID
                )
            ) {

                await member.roles.add(
                    ROLE_ID
                );
            }

            if (

                monitoredChannels.includes(
                    oldChannel
                ) &&

                !monitoredChannels.includes(
                    newChannel
                )
            ) {

                await member.roles.remove(
                    ROLE_ID
                );
            }

        } catch (err) {

            console.error(err);
        }
    }
);

cron.schedule(

    '0 5 * * *',

    async () => {

        console.log(
            '🧹 Iniciando verificação automática...'
        );

        const guild =
            await client.guilds.fetch(
                GUILD_ID
            );

        executarLimpeza(
            guild
        );

    },

    {
        timezone:
            'America/Sao_Paulo'
    }
);

client.login(
    process.env.TOKEN
);
```
