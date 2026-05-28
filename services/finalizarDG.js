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

    salvarPlayer,
    buscarRanking

} = require(
    './rankingService'
);

const {

    criarRankingEmbed

} = require(
    './rankingEmbeds'
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
        !players
    ) {

        return interaction.reply({

            content:
                '❌ Dados da DG não encontrados.',

            ephemeral: true
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

    const ranking =
        await buscarRanking();

    const embed =
        criarRankingEmbed(
            ranking
        );

    const canal =
        interaction.guild.channels.cache.get(
            process.env.RANKING_GERAL_CHANNEL_ID
        );

    const mensagens =
        await canal.messages.fetch({
            limit: 10
        });

    const antiga =
        mensagens.find(
            m =>
                m.author.id ===
                interaction.client.user.id
        );

    if (antiga) {

        await antiga.edit({
            embeds: [embed]
        });

    } else {

        await canal.send({
            embeds: [embed]
        });
    }

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
            '✅ DG finalizada com sucesso.',

        ephemeral: true
    });
}

module.exports = {
    finalizarDG
};