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

const {

    atualizarRankingClasses

} = require(
    './classRankingEmbedManager'
);

// LOCK DE FINALIZAÇÃO
const finalizandoDG =
    new Set();

async function finalizarDG(
    interaction
) {

    const userId =
        interaction.user.id;

    // EVITA DUPLO CLIQUE
    if (
        finalizandoDG.has(
            userId
        )
    ) {

        return interaction.reply({

            content:
                '⚠️ Esta DG já está sendo finalizada.',

            ephemeral: true
        });
    }

    finalizandoDG.add(
        userId
    );

    try {

        await interaction.deferUpdate();

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

            finalizandoDG.delete(
                userId
            );

            return interaction.followUp({

                content:
                    '❌ Dados da DG não encontrados.',

                ephemeral: true
            });
        }

        // REMOVE SESSÕES IMEDIATAMENTE
        classSelections.delete(
            userId
        );

        metterSessions.delete(
            userId
        );

        dgSessions.delete(
            userId
        );

        // DESATIVA BOTÕES
        await interaction.editReply({

            components: []
        });

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

        await atualizarRankingClasses(

            interaction.client,

            process.env
                .RANKING_CLASSES_CHANNEL_ID
        );

        return interaction.followUp({

            content:
                '✅ DG finalizada com sucesso.',

            ephemeral: true
        });

    } catch (err) {

        console.error(err);

        return interaction.followUp({

            content:
                '❌ Erro ao finalizar DG.',

            ephemeral: true
        });

    } finally {

        finalizandoDG.delete(
            userId
        );
    }
}

module.exports = {

    finalizarDG
};