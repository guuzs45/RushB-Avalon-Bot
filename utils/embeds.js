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
    players
) {

    const embed =
        new EmbedBuilder()

            .setColor(
                '#5865F2'
            )

            .setTitle(
                '📋 Selecione as classes'
            )

            .setDescription(
                'Selecione a classe de cada player.'
            );

    const rows = [];

    for (
        const player of players
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

    const finalizarButton =
        new ActionRowBuilder()

            .addComponents(

                new ButtonBuilder()

                    .setCustomId(
                        'finalizar_dg'
                    )

                    .setLabel(
                        'Finalizar DG'
                    )

                    .setStyle(
                        ButtonStyle.Success
                    )
            );

    rows.push(
        finalizarButton
    );

    return {

        embed,
        rows
    };
}

module.exports = {

    criarEmbedSelecaoClasses
};