const {

    atualizarRankingEmbed

} = require(
    '../services/rankingEmbedManager'
);

async function executarAttrank(
    interaction,
    client
) {

    await interaction.deferReply({

        ephemeral: true
    });

    await atualizarRankingEmbed(

        client,

        process.env
            .RANKING_GERAL_CHANNEL_ID,

        0
    );

    return interaction.editReply({

        content:
            '✅ Ranking atualizado.'
    });
}

module.exports = {

    executarAttrank
};