const {

    atualizarRankingEmbed

} = require(
    './rankingEmbedManager'
);

async function processarRankingButtons(
    interaction
) {

    const id =
        interaction.customId;

    const currentPage =
        Number(
            id.split('_')[2]
        );

    let nextPage =
        currentPage;

    if (
        id.startsWith(
            'rank_next'
        )
    ) {

        nextPage++;
    }

    if (
        id.startsWith(
            'rank_prev'
        )
    ) {

        nextPage--;

        if (nextPage < 0)
            nextPage = 0;
    }

    await atualizarRankingEmbed(

        interaction.client,

        process.env
            .RANKING_GERAL_CHANNEL_ID,

        nextPage
    );

    await interaction.deferUpdate();
}

module.exports = {

    processarRankingButtons
};