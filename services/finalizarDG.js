const classSelections =
    require(
        '../data/classSelections'
    );

const metterSessions =
    require(
        '../data/metterSessions'
    );

const dgSessions =
    require(
        '../data/dgSessions'
    );

const {

    salvarPlayer

} = require(
    './rankingService'
);

const {

    atualizarRankingEmbed

} = require(
    './rankingEmbedManager'
);

async function finalizarDG(
    interaction
) {

    await interaction.deferReply({

        ephemeral: true
    });

    const userId =
        interaction.user.id;

    const classes =
        classSelections.get(
            userId
        );

    const players =
        metterSessions.get(
            userId
        );

    const dgInfo =
        dgSessions.get(
            userId
        );

    if (
        !classes ||
        !players ||
        !dgInfo
    ) {

        return interaction.editReply({

            content:
                '❌ Dados da DG não encontrados.'
        });
    }

    for (
        const player of players
    ) {

        const classe =
            classes[
                player.nickname
            ];

        if (!classe)
            continue;

        await salvarPlayer({

            nickname:
                player.nickname,

            classe,

            dano:
                player.dano,

            dps:
                player.dps,

            qtdDG:
                dgInfo.qtd
        });
    }

    await atualizarRankingEmbed(

        interaction.client,

        process.env
            .RANKING_GERAL_CHANNEL_ID,

        0
    );

    classSelections.delete(
        userId
    );

    metterSessions.delete(
        userId
    );

    dgSessions.delete(
        userId
    );

    return interaction.editReply({

        content:
            '✅ DG finalizada com sucesso.'
    });
}

module.exports = {

    finalizarDG
};