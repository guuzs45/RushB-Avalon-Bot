const {

    atualizarRankingEmbed

} = require(
    '../services/rankingEmbedManager'
);

async function executarAttrank(
    client
) {

    await atualizarRankingEmbed(

        client,

        process.env
            .RANKING_GERAL_CHANNEL_ID,

        0
    );
}

module.exports = {

    executarAttrank
};