const {

    EmbedBuilder

} = require(
    'discord.js'
);

const {

    CLASS_MAPPINGS

} = require(
    '../utils/constants'
);

function criarRankingEmbed(
    ranking
) {

    const embed =
        new EmbedBuilder()

            .setColor(
                '#5865F2'
            )

            .setTitle(
                '🏆 Ranking Geral DG'
            );

    let descricao = '';

    ranking.forEach(
        (
            player,
            index
        ) => {

            let medalha =
                `${index + 1}.`;

            if (index === 0)
                medalha = '🥇';

            if (index === 1)
                medalha = '🥈';

            if (index === 2)
                medalha = '🥉';

            const classe =
                CLASS_MAPPINGS[
                    player.classe
                ];

            descricao +=
`${medalha} ${classe?.emoji || '❓'} ${player.nickname}

🏰 ${player.totalDG} DGs
⚔️ ${player.maxDano.toLocaleString()}
🔥 ${player.maxDps}

\n`;
        }
    );

    embed.setDescription(
        descricao
    );

    embed.setFooter({

        text:
            `Atualizado em ${new Date().toLocaleString('pt-BR')}`
    });

    return embed;
}

module.exports = {
    criarRankingEmbed
};