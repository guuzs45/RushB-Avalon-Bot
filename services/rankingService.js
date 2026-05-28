const {

    GoogleSpreadsheet

} = require(
    'google-spreadsheet'
);

const {

    JWT

} = require(
    'google-auth-library'
);

const serviceAccount =
    JSON.parse(
        process.env.GOOGLE_SERVICE_ACCOUNT
    );

const auth =
    new JWT({

        email:
            serviceAccount.client_email,

        key:
            serviceAccount.private_key,

        scopes: [

            'https://www.googleapis.com/auth/spreadsheets'
        ]
    });

const doc =
    new GoogleSpreadsheet(

        process.env.SHEET_ID,
        auth
    );

let rankingSheet;

async function iniciarRankingSheet() {

    await doc.loadInfo();

    rankingSheet =
        doc.sheetsByTitle[
            'RankingDG'
        ];
}

function parseNumero(
    valor
) {

    return Number(

        String(valor || 0)

            .replaceAll(
                '.',
                ''
            )

            .replace(
                ',',
                '.'
            )
    );
}

async function salvarPlayer({

    nickname,
    classe,
    dano,
    dps,
    qtdDG

}) {

    const rows =
        await rankingSheet.getRows();

    let row =
        rows.find(

            r =>

                r.get(
                    'nickname'
                ) === nickname
        );

    if (!row) {

        await rankingSheet.addRow({

            nickname,

            totalDG:
                qtdDG,

            classe,

            maxDano:
                Number(dano),

            maxDps:
                Number(dps)
        });

        return;
    }

    const totalDG =
        parseNumero(
            row.get(
                'totalDG'
            )
        );

    const maxDano =
        parseNumero(
            row.get(
                'maxDano'
            )
        );

    const maxDps =
        parseNumero(
            row.get(
                'maxDps'
            )
        );

    row.set(
        'totalDG',
        totalDG + qtdDG
    );

    row.set(
        'classe',
        classe
    );

    row.set(
        'maxDano',
        Math.max(
            maxDano,
            Number(dano)
        )
    );

    row.set(
        'maxDps',
        Math.max(
            maxDps,
            Number(dps)
        )
    );

    await row.save();
}

async function buscarRanking() {

    const rows =
        await rankingSheet.getRows();

    return rows

        .map(
            row => ({

                nickname:
                    row.get(
                        'nickname'
                    ),

                totalDG:
                    parseNumero(
                        row.get(
                            'totalDG'
                        )
                    ),

                classe:
                    row.get(
                        'classe'
                    ),

                maxDano:
                    parseNumero(
                        row.get(
                            'maxDano'
                        )
                    ),

                maxDps:
                    parseNumero(
                        row.get(
                            'maxDps'
                        )
                    )
            })
        )

        .sort(
            (a, b) =>
                b.totalDG -
                a.totalDG
        );
}

module.exports = {

    iniciarRankingSheet,
    salvarPlayer,
    buscarRanking
};