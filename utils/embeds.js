const {

    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder

} = require(
    'discord.js'
);

const {
    CLASS_MAPPINGS
} = require(
    './constants'
);

function criarSelectClasse(
    player,
    index
) {

    return new StringSelectMenuBuilder()

        .setCustomId(
    `classe_${player.nickname}`
)

        .setPlaceholder(
            `Classe de ${player}`
        )

        .addOptions(

            Object.entries(
                CLASS_MAPPINGS
            ).map(
                ([key, value]) => ({

                    label:
                        value.label,

                    value:
                        key,

                    emoji:
                        value.emoji
                })
            )
        );
}

function criarPaginaClasses({

    players,
    pagina,
    totalPaginas

}) {

    const embed =
        new EmbedBuilder()

            .setColor(
                '#5865F2'
            )

            .setTitle(
                '📊 Registrar Classes'
            )

            .setDescription(
                'Selecione a classe de cada jogador.'
            )

            .setFooter({

                text:
                    `Página ${pagina}/${totalPaginas}`
            });

    const rows = [];

    players.forEach(
        (player, index) => {

            rows.push(

                new ActionRowBuilder()

                    .addComponents(

                        criarSelectClasse(
                            player.nickname,
                            index
                        )
                    )
            );
        }
    );

    const {

    ButtonBuilder,
    ButtonStyle

} = require(
    'discord.js'
);

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

    criarPaginaClasses
};