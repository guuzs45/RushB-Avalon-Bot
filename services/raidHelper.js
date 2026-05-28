const {
    CLASS_MAPPINGS
} = require(
    '../utils/constants'
);

async function extrairParticipantesRH(
    mensagem
) {

    const participantes = {};

    const embed =
        mensagem.embeds[0];

    if (!embed)
        return participantes;

    for (
        const field of
        embed.fields
    ) {

        let classeKey = null;

        for (
            const key of
            Object.keys(
                CLASS_MAPPINGS
            )
        ) {

            const classe =
                CLASS_MAPPINGS[key];

            if (
                field.name.includes(
                    key.replaceAll(
                        '_',
                        ' '
                    )
                )
            ) {

                classeKey = key;
                break;
            }
        }

        if (!classeKey)
            continue;

        const matches =
    field.value.matchAll(
        /<@!?(\d+)>/g
    );

for (
    const match of matches
) {

    const userId =
        match[1];

    try {

        const member =
            await mensagem.guild.members.fetch(
                userId
            );

        const nickname =
            (
                member.nickname ||
                member.user.username
            )
                .toLowerCase();

        participantes[
            nickname
        ] = classeKey;

    } catch {}
}
    }

    return participantes;
}

module.exports = {
    extrairParticipantesRH
};