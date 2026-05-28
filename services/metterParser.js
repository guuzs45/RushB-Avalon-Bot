function parseMetter(
    texto
) {

    const linhas =
        texto.split('\n');

    const players = [];

    for (
        const linha of linhas
    ) {

        const match =
            linha.match(
                /\d+\.\s(.+?):\s([\d]+).*?([\d,.]+)\sDPS/i
            );

        if (!match)
            continue;

        const nickname =
            match[1]
                .trim();

        const dano =
            Number(
                match[2]
                    .replaceAll(
                        '.',
                        ''
                    )
            );

        const dps =
            Number(
                match[3]
                    .replace(
                        ',',
                        '.'
                    )
            );

        players.push({

            nickname,
            dano,
            dps
        });
    }

    return players;
}

module.exports = {
    parseMetter
};