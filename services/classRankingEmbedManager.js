const {

    EmbedBuilder

} = require(
    'discord.js'
);

const {

    buscarRanking

} = require(
    './rankingService'
);

const {

    CLASS_MAPPINGS

} = require(
    '../utils/constants'
);

const rankingMessages =
    new Map();

function formatarMilhoes(
    numero
) {

    return (
        Number(numero || 0) /
        1000000
    ).toFixed(1) + 'm';
}

function formatarDps(
    numero
) {

    return Math.floor(
        Number(numero || 0)
    );
}

function obterClasse(
    classe
) {

    return CLASS_MAPPINGS[
        classe
    ] || {

        emoji: '⚔️',

        nome:
            classe || 'Desconhecida'
    };
}

function criarSecaoClasse(
    classe,
    players
) {

    const dadosClasse =
        obterClasse(
            classe
        );

    const top3 =
        players

            .sort(
                (a, b) =>
                    b.totalDG -
                    a.totalDG
            )

            .slice(0, 3);

    if (
        top3.length === 0
    ) {

        return '';
    }

    const medals = [

        '🥇',
        '🥈',
        '🥉'
    ];

    return [

        `## ${dadosClasse.emoji} ${dadosClasse.nome}`,

        '',

        ...top3.map(

            (player, index) => [

                `${medals[index]} ${player.nickname} • ${player.totalDG} DGs`,

                `⚔️ ${formatarMilhoes(player.maxDano)} • 🔥 ${formatarDps(player.maxDps)}`
            ]

            .join('\n')
        )

    ].join('\n\n');
}

async function atualizarRankingClasses(
    client,
    channelId
) {

    const ranking =
        await buscarRanking();

    const agrupado = {};

    for (
        const player of ranking
    ) {

        if (
            !agrupado[
                player.classe
            ]
        ) {

            agrupado[
                player.classe
            ] = [];
        }

        agrupado[
            player.classe
        ].push(player);
    }

    const secoes =
        Object.keys(
            agrupado
        )

        .map(

            classe =>

                criarSecaoClasse(

                    classe,

                    agrupado[
                        classe
                    ]
                )
        )

        .filter(Boolean)

        .join(
            '\n\n──────────────\n\n'
        );

    const embed =
        new EmbedBuilder()

            .setColor(
                '#9B59B6'
            )

            .setTitle(
                '🎭 Ranking por Classes'
            )

            .setDescription(

                secoes ||
                'Sem dados.'
            )

            .setFooter({

                text:
                    'Sistema Avalon DG'
            })

            .setTimestamp();

    const channel =
        await client.channels.fetch(
            channelId
        );

    let messageId =
        rankingMessages.get(
            channelId
        );

    try {

        if (messageId) {

            const oldMessage =
                await channel.messages.fetch(
                    messageId
                );

            await oldMessage.edit({

                embeds: [embed]
            });

            return;
        }

    } catch {}

    const msg =
        await channel.send({

            embeds: [embed]
        });

    rankingMessages.set(
        channelId,
        msg.id
    );
}

module.exports = {

    atualizarRankingClasses
};
