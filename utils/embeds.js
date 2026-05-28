const {

    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle

} = require(
    'discord.js'
);

const {

    CLASS_MAPPINGS

} = require(
    './constants'
);

function criarEmbedSelecaoClasses(
    players,
    page = 0
) {

    const playersPerPage = 4;

    const start =
        page * playersPerPage;

    const end =
        start + playersPerPage;

    const paginaPlayers =
        players.slice(
            start,
            end
        );

    const totalPages =
        Math.ceil(
            players.length /
            playersPerPage
        );

    const embed =
        new EmbedBuilder()

            .setColor(
                '#5865F2'
            )

            .setTitle(
                '📋 Selecione as classes'
            )

            .setDescription(

                `Selecione a classe de cada player.\n\nPágina ${page + 1}/${totalPages}`
            );

    const rows = [];

    for (
        const player of paginaPlayers
    ) {

        const menu =
            new StringSelectMenuBuilder()

                .setCustomId(
                    `classe_${player.nickname}`
                )

                .setPlaceholder(
                    `Classe de ${player.nickname}`
                )

                .addOptions(

                    Object.entries(
                        CLASS_MAPPINGS
                    ).map(

                        ([key, value]) => ({

                            label:
                                value.nome,

                            value:
                                key,

                            emoji:
                                value.emoji
                        })
                    )
                );

        rows.push(

            new ActionRowBuilder()

                .addComponents(
                    menu
                )
        );
    }

    const navButtons =
        new ActionRowBuilder();

    if (
        page > 0
    ) {

        navButtons.addComponents(

            new ButtonBuilder()

                .setCustomId(
                    `classe_prev_${page}`
                )

                .setLabel(
                    '⬅️ Voltar'
                )

                .setStyle(
                    ButtonStyle.Secondary
                )
        );
    }

    if (
        page <
        totalPages - 1
    ) {

        navButtons.addComponents(

            new ButtonBuilder()

                .setCustomId(
                    `classe_next_${page}`
                )

                .setLabel(
                    '➡️ Próxima'
                )

                .setStyle(
                    ButtonStyle.Primary
                )
        );
    }

    if (
        page ===
        totalPages - 1
    ) {

        navButtons.addComponents(

            new ButtonBuilder()

                .setCustomId(
                    'finalizar_dg'
                )

                .setLabel(
                    '✅ Finalizar DG'
                )

                .setStyle(
                    ButtonStyle.Success
                )
        );
    }

    rows.push(
        navButtons
    );

    return {

        embed,
        rows
    };
}

module.exports = {

    criarEmbedSelecaoClasses
};