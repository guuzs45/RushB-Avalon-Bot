const {

    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle

} = require(
    'discord.js'
);

const {

    DG_ALLOWED_ROLES

} = require(
    '../utils/constants'
);

const dgSessions =
    require(
        '../data/dgSessions'
    );

const metterSessions =
    require(
        '../data/metterSessions'
    );

const {

    parseMetter

} = require(
    '../services/metterParser'
);

const {

    criarEmbedSelecaoClasses

} = require(
    '../utils/embeds'
);

async function executarRegistroDG(
    interaction
) {

    const autorizado =
        interaction.member.roles.cache.some(
            role =>
                DG_ALLOWED_ROLES.includes(
                    role.id
                )
        );

    if (!autorizado) {

        return interaction.reply({

            content:
                '❌ Sem permissão.',

            ephemeral: true
        });
    }

    const modal =
        new ModalBuilder()

            .setCustomId(
                'registrar_dg_modal'
            )

            .setTitle(
                'Registrar DG'
            );

    const dataInput =
        new TextInputBuilder()

            .setCustomId(
                'data'
            )

            .setLabel(
                'Data da DG'
            )

            .setPlaceholder(
                '26/05/2026'
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setRequired(true);

    const horarioInput =
        new TextInputBuilder()

            .setCustomId(
                'horario'
            )

            .setLabel(
                'Horário da DG'
            )

            .setPlaceholder(
                '18:50'
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setRequired(true);

    const qtdInput =
        new TextInputBuilder()

            .setCustomId(
                'qtd'
            )

            .setLabel(
                'Quantidade de DGs'
            )

            .setPlaceholder(
                '3'
            )

            .setStyle(
                TextInputStyle.Short
            )

            .setRequired(true);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(
                dataInput
            ),

        new ActionRowBuilder()
            .addComponents(
                horarioInput
            ),

        new ActionRowBuilder()
            .addComponents(
                qtdInput
            )
    );

    await interaction.showModal(
        modal
    );
}

async function processarModalDG(
    interaction
) {

    const data =
        interaction.fields.getTextInputValue(
            'data'
        );

    const horario =
        interaction.fields.getTextInputValue(
            'horario'
        );

    const qtd =
        Number(
            interaction.fields.getTextInputValue(
                'qtd'
            )
        );

    dgSessions.set(
        interaction.user.id,
        {

            data,
            horario,
            qtd,

            metterAtual: 1
        }
    );

    metterSessions.set(
        interaction.user.id,
        []
    );

    const botao =
        new ButtonBuilder()

            .setCustomId(
                'enviar_metter'
            )

            .setLabel(
                `Enviar Metter 1/${qtd}`
            )

            .setStyle(
                ButtonStyle.Primary
            );

    return interaction.reply({

        content:
`✅ DG registrada.

📅 ${data}
🕒 ${horario}
🏰 ${qtd} DG(s)

Clique abaixo para enviar o primeiro metter.`,

        components: [

            new ActionRowBuilder()
                .addComponents(
                    botao
                )
        ],

        ephemeral: true
    });
}

async function abrirModalMetter(
    interaction
) {

    const dgInfo =
        dgSessions.get(
            interaction.user.id
        );

    if (!dgInfo) {

        return interaction.reply({

            content:
                '❌ Sessão expirada.',

            ephemeral: true
        });
    }

    const modal =
        new ModalBuilder()

            .setCustomId(
                'metter_modal'
            )

            .setTitle(

                `Metter ${dgInfo.metterAtual}/${dgInfo.qtd}`
            );

    const input =
        new TextInputBuilder()

            .setCustomId(
                'metter'
            )

            .setLabel(
                'Cole o metter'
            )

            .setStyle(
                TextInputStyle.Paragraph
            )

            .setRequired(true);

    modal.addComponents(

        new ActionRowBuilder()

            .addComponents(
                input
            )
    );

    await interaction.showModal(
        modal
    );
}

async function processarMetter(
    interaction
) {

    const texto =
        interaction.fields.getTextInputValue(
            'metter'
        );

    const players =
        parseMetter(
            texto
        );

    if (
        players.length === 0
    ) {

        return interaction.reply({

            content:
                '❌ Nenhum player encontrado no metter.',

            ephemeral: true
        });
    }

    const dgInfo =
        dgSessions.get(
            interaction.user.id
        );

    if (!dgInfo) {

        return interaction.reply({

            content:
                '❌ Sessão expirada.',

            ephemeral: true
        });
    }

    const acumulado =
        metterSessions.get(
            interaction.user.id
        ) || [];

    acumulado.push(
        ...players
    );

    metterSessions.set(
        interaction.user.id,
        acumulado
    );

    // AINDA EXISTEM METTERS
    if (
        dgInfo.metterAtual <
        dgInfo.qtd
    ) {

        dgInfo.metterAtual++;

        dgSessions.set(
            interaction.user.id,
            dgInfo
        );

        const botao =
            new ButtonBuilder()

                .setCustomId(
                    'enviar_metter'
                )

                .setLabel(

`Enviar Metter ${dgInfo.metterAtual}/${dgInfo.qtd}`
                )

                .setStyle(
                    ButtonStyle.Primary
                );

        return interaction.reply({

            content:

`✅ Metter ${dgInfo.metterAtual - 1}/${dgInfo.qtd} salvo.

Clique abaixo para enviar o próximo metter.`,

            components: [

                new ActionRowBuilder()

                    .addComponents(
                        botao
                    )
            ],

            ephemeral: true
        });
    }

    // REMOVE DUPLICADOS PARA SELEÇÃO
    const unicos =
        [];

    const nomes =
        new Set();

    for (
        const player of acumulado
    ) {

        if (
            nomes.has(
                player.nickname
            )
        ) continue;

        nomes.add(
            player.nickname
        );

        unicos.push(
            player
        );
    }

    const {

        embed,
        rows

    } =
        criarEmbedSelecaoClasses(

            unicos,

            0
        );

    return interaction.reply({

        embeds: [embed],

        components: rows,

        ephemeral: true
    });
}

module.exports = {

    executarRegistroDG,
    processarModalDG,
    abrirModalMetter,
    processarMetter
};