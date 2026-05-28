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

    DG_ALLOWED_ROLES,
    RAID_ACTIVE_CHANNEL_ID,
    RAID_ARCHIVE_CHANNEL_ID

} = require(
    '../utils/constants'
);

const dgSessions =
    require(
        '../data/dgSessions'
    );

const {

    extrairParticipantesRH

} = require(
    '../services/raidHelper'
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

    const mensagemInput =
        new TextInputBuilder()

            .setCustomId(
                'mensagem_id'
            )

            .setLabel(
                'ID da mensagem RH'
            )

            .setPlaceholder(
                '150999999999999999'
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
            ),

        new ActionRowBuilder()
            .addComponents(
                mensagemInput
            )
    );

    await interaction.showModal(
        modal
    );
}

async function processarModalDG(
    interaction,
    client
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

    const mensagemId =
        interaction.fields.getTextInputValue(
            'mensagem_id'
        );

    let evento = null;

    const canais = [

        client.channels.cache.get(
            RAID_ACTIVE_CHANNEL_ID
        ),

        client.channels.cache.get(
            RAID_ARCHIVE_CHANNEL_ID
        )
    ];

    for (const canal of canais) {

        try {

            evento =
                await canal.messages.fetch(
                    mensagemId
                );

            if (evento)
                break;

        } catch {}
    }

    if (!evento) {

        return interaction.reply({
            content:
                '❌ Evento não encontrado.',
            ephemeral: true
        });
    }

    const participantes =
        await extrairParticipantesRH(
            evento
        );

    dgSessions.set(
        interaction.user.id,
        {

            data,
            horario,
            qtd,

            restante: qtd,

            participantes
        }
    );

    const botao =
        new ButtonBuilder()

            .setCustomId(
                'enviar_metter'
            )

            .setLabel(
                'Enviar Metter'
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

👥 ${Object.keys(participantes).length} participantes encontrados.`,

        components: [

            new ActionRowBuilder()
                .addComponents(
                    botao
                )
        ],

        ephemeral: true
    });
}

module.exports = {

    executarRegistroDG,
    processarModalDG
};