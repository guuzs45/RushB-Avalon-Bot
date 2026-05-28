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

function formatarNumero(
    numero
) {

    return Number(
        numero || 0
    ).toLocaleString(
        'pt-BR'
    );
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
                `# ${medals[index]} ${player.nickname}`,
                `${emojiClasse(player.classe)} ${player.totalDG} DGs`,
                `⚔️ ${formatarNumero(player.maxDano)}`,
                `🔥 ${formatarNumero(player.maxDps)} DPS`
            ].join('\n');
        }

    ).join('\n\n──────────────\n\n');
}

function criarLista(
    ranking,
    page
) {

    const semTop3 =
        ranking.slice(3);

    const start =
        page * 10;

    const end =
        start + 10;

    const players =
        semTop3.slice(
            start,
            end
        );

    if (
        players.length === 0
    ) {

        return 'Sem players.';
    }

    return players.map(

        (player, index) => {

            const pos =
                start + index + 4;

            return [
                `\`${pos}.\` ${emojiClasse(player.classe)} **${player.nickname}**`,
                `└ 🏰 ${player.totalDG} • ⚔️ ${formatarNumero(player.maxDano)} • 🔥 ${formatarNumero(player.maxDps)}`
            ].join('\n');
        }

    ).join('\n\n');
}

async function atualizarRankingEmbed(
    client,
    channelId,
    page = 0
) {

    const ranking =
        await buscarRanking();

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                (ranking.length - 3) / 10
            )
        );

    if (
        page >= totalPages
    ) {

        page = 0;
    }

    const embed =
        new EmbedBuilder()

            .setColor(
                '#5865F2'
            )

            .setTitle(
                '🏆 Ranking DG Avalon'
            )

            .setDescription(

                [
                    '## 🔥 Top 3\n',
                    criarTop3(
                        ranking
                    ),

                    '\n\n## 📜 Ranking Geral\n',

                    criarLista(
                        ranking,
                        page
                    )
                ].join('')
            )

            .setFooter({

                text:
                    `Página ${page + 1}/${totalPages} • Sistema Avalon DG`
            })

            .setTimestamp();

    const row =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        `rank_prev_${page}`
                    )

                    .setEmoji(
                        '⬅️'
                    )

                    .setStyle(
                        ButtonStyle.Secondary
                    ),

                new ButtonBuilder()

                    .setCustomId(
                        `rank_next_${page}`
                    )

                    .setEmoji(
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