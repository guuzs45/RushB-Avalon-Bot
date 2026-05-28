function parseMetter(
    texto
) {

    const linhas =
        texto
            .split('\n')
            .map(
                l => l.trim()
            )
            .filter(Boolean);

    const players = [];

    for (
        const linha of linhas
    ) {

        const match =
            linha.match(
                /^\d+\.\s(.+?):\s([\d.,KMB]+)\(([\d.,]+)%\)\|([\d.,]+)\sDPS$/i
            );

        if (!match)
            continue;

        const nickname =
            match[1].trim();

        const damage =
            match[2];

        const percent =
            match[3];

        const dps =
            match[4];

        players.push({

            nickname,
            damage,
            percent,
            dps
        });
    }

    return players;
}

module.exports = {
    parseMetter
};