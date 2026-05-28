const classSelections =
    require(
        '../data/classSelections'
    );

async function processarClasseSelecionada(
    interaction
) {

    const player =
        interaction.customId.replace(
            'classe_',
            ''
        );

    const classe =
        interaction.values[0];

    const userId =
        interaction.user.id;

    if (
        !classSelections.has(
            userId
        )
    ) {

        classSelections.set(
            userId,
            {}
        );
    }

    const selections =
        classSelections.get(
            userId
        );

    selections[player] =
        classe;

    classSelections.set(
        userId,
        selections
    );

    await interaction.reply({

        content:
`✅ ${player} registrado como ${classe}`,

        ephemeral: true
    });
}

module.exports = {
    processarClasseSelecionada
};