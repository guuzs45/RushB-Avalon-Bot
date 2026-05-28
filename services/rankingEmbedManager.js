const {

    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle

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

function emojiClasse(
    classe
) {

    return CLASS_MAPPINGS[
        classe
    ]?.emoji || '⚔️';
}

function criarTop3(
    ranking
) {

    const top3 =
        ranking.slice(0, 3);

    const medals = [
        '🥇',
        '🥈',
        '🥉'
    ];

    return top3.map(
        (player, index) => {

            return [
                `${medals[index]} ${emojiClasse(player.classe)} ${player.nickname}`,
                `🏰 ${player.totalDG} DGs`,
                `⚔️ ${player.maxDano.toLocaleString('pt-BR')}`,
                `🔥 ${player.maxDps.toFixed(0)} DPS`
            ].join('\n');
        }
    ).join('\n\n');
}

function criarLista(
    ranking,
    page
) {

    const start =
        page * 10;

    const end =
        start + 10;

    const players =
        ranking.slice(
            start,
            end
        );

    return players.map(
        (player, index) => {

            const pos =
                start + index + 1;

            return `${pos}. ${emojiClasse(player.classe)} ${player.nickname} • ${player.totalDG} DGs`;
        }
    ).join('\n');
}

async function atualizarRankingEmbed(
    client,
    channelId,
    page = 0
) {

    const ranking =
        await buscarRanking();

    const totalPages =
        Math.ceil(
            ranking.length / 10
        );

    const embed =
        new EmbedBuilder()

            .setColor(
                '#5865F2'
            )

            .setTitle(
                '🏆 Ranking DG Avalon'
            )

            .addFields(

                {

                    name:
                        '🔥 Top 3',

                    value:
                        criarTop3(
                            ranking
                        ) || 'Sem dados.'
                },

                {

                    name:
                        `📜 Ranking Geral • Página ${page + 1}/${totalPages || 1}`,

                    value:
                        criarLista(
                            ranking,
                            page
                        ) || 'Sem players.'
                }
            )

            .setFooter({

                text:
                    'Sistema Avalon DG'
            })

            .setTimestamp();

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        `rank_prev_${page}`
                    )

                    .setLabel(
                        '⬅️'
                    )

                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()

                    .setCustomId(
                        `rank_next_${page}`
                    )

                    .setLabel(
                        '➡️'
                    )

                    .setStyle(
                        ButtonStyle.Secondary
                    )
            );

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

                embeds: [embed],
                components: [row]
            });

            return;
        }

    } catch {}

    const msg =
        await channel.send({

            embeds: [embed],
            components: [row]
        });

    rankingMessages.set(
        channelId,
        msg.id
    );
}

module.exports = {

    atualizarRankingEmbed
};