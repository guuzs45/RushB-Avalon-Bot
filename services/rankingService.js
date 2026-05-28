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
        Number(
            row.get(
                'totalDG'
            ) || 0
        );

    const maxDano =
        Number(
            row.get(
                'maxDano'
            ) || 0
        );

    const maxDps =
        Number(
            row.get(
                'maxDps'
            ) || 0
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
                    Number(
                        row.get(
                            'totalDG'
                        ) || 0
                    ),

                classe:
                    row.get(
                        'classe'
                    ),

                maxDano:
                    Number(
                        row.get(
                            'maxDano'
                        ) || 0
                    ),

                maxDps:
                    Number(
                        row.get(
                            'maxDps'
                        ) || 0
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