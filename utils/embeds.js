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
            `classe_${index}`
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

    return {
        embed,
        rows
    };
}

module.exports = {

    criarPaginaClasses
};