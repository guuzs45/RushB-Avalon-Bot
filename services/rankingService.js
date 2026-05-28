async function atualizarRankingPlayer({

    rankingSheet,
    nickname,
    classe,
    damage,
    dps

}) {

    const rows =
        await rankingSheet.getRows();

    let row =
        rows.find(
            r =>
                r.get('nickname')
                    ?.toLowerCase() ===
                nickname.toLowerCase()
        );

    if (!row) {

        await rankingSheet.addRow({

            nickname,

            totalDGs: 1,

            maxDamage: damage,

            maxDps: dps,

            classesData:
                JSON.stringify({
                    [classe]: 1
                }),

            updatedAt:
                Date.now()
        });

        return;
    }

    const totalDGs =
        Number(
            row.get('totalDGs') || 0
        ) + 1;

    const maxDamage =
        Math.max(
            Number(
                row.get('maxDamage') || 0
            ),
            Number(damage)
        );

    const maxDps =
        Math.max(
            Number(
                row.get('maxDps') || 0
            ),
            Number(dps)
        );

    let classesData = {};

    try {

        classesData =
            JSON.parse(
                row.get('classesData') || '{}'
            );

    } catch {}

    classesData[classe] =
        (classesData[classe] || 0) + 1;

    row.set(
        'totalDGs',
        totalDGs
    );

    row.set(
        'maxDamage',
        maxDamage
    );

    row.set(
        'maxDps',
        maxDps
    );

    row.set(
        'classesData',
        JSON.stringify(
            classesData
        )
    );

    row.set(
        'updatedAt',
        Date.now()
    );

    await row.save();
}

module.exports = {
    atualizarRankingPlayer
};