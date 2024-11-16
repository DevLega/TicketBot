const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");
require("dotenv").config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`Бот запущен как ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "apply_button") {
      // Создание модального окна
      const modal = new ModalBuilder()
        .setCustomId("application_form")
        .setTitle("Заявка на сервер");

      const nicknameInput = new TextInputBuilder()
        .setCustomId("nickname")
        .setLabel("Ваш никнейм в игре")
        .setStyle(TextInputStyle.Short);

      const goalsInput = new TextInputBuilder()
        .setCustomId("goals")
        .setLabel("Какие ваши цели на проекте")
        .setStyle(TextInputStyle.Paragraph);

      const timeInput = new TextInputBuilder()
        .setCustomId("time")
        .setLabel("Сколько вы готовы уделять времени серверу?")
        .setStyle(TextInputStyle.Short);

      const sourceInput = new TextInputBuilder()
        .setCustomId("source")
        .setLabel("Откуда вы узнали о нас?")
        .setStyle(TextInputStyle.Short);

      const aboutInput = new TextInputBuilder()
        .setCustomId("about")
        .setLabel("Расскажите немного о себе")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nicknameInput),
        new ActionRowBuilder().addComponents(goalsInput),
        new ActionRowBuilder().addComponents(timeInput),
        new ActionRowBuilder().addComponents(sourceInput),
        new ActionRowBuilder().addComponents(aboutInput)
      );

      await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "application_form") {
      const nickname = interaction.fields.getTextInputValue("nickname");
      const goals = interaction.fields.getTextInputValue("goals");
      const time = interaction.fields.getTextInputValue("time");
      const source = interaction.fields.getTextInputValue("source");
      const about = interaction.fields.getTextInputValue("about");
      const userTag = interaction.user.tag; // Получаем тег пользователя

      const channel = client.channels.cache.get("1275002461190488118");
      const message = await channel.send({
        content:
          `**📝 Новая заявка от @${userTag}:**\n\n` +
          `**📌 Никнейм**: ${nickname}\n` +
          `**🎯 Цели**: ${goals}\n` +
          `**⏳ Время**: ${time}\n` +
          `**🔍 Источник**: ${source}\n` +
          `**🗣 О себе**: ${about}\n\n` +
          `**❓ Что хотите сделать с заявкой?**`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("approve")
              .setLabel("Одобрить")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("decline")
              .setLabel("Отклонить")
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });

      await interaction.reply({
        content: "Заявка отправлена!",
        ephemeral: true,
      });

      // Слушаем нажатие кнопок "Одобрить" и "Отклонить"
      const collector = channel.createMessageComponentCollector();

      collector.on("collect", async (buttonInteraction) => {
        const userTag = interaction.user.tag; // Получаем тег пользователя
        const nickname = interaction.fields.getTextInputValue("nickname");
        const goals = interaction.fields.getTextInputValue("goals");
        const time = interaction.fields.getTextInputValue("time");
        const source = interaction.fields.getTextInputValue("source");
        const about = interaction.fields.getTextInputValue("about");

        if (buttonInteraction.customId === "approve") {
          // Одобрение заявки
          const user = await client.users.fetch(interaction.user.id);
          await user.send("Ваша заявка была одобрена!");

          const member = await interaction.guild.members.fetch(
            interaction.user.id
          );

          // Роли для выдачи и снятия
          const roleToAdd = interaction.guild.roles.cache.get(
            "1264317583650324583"
          ); // Замените на ID роли для выдачи
          const roleToRemove = interaction.guild.roles.cache.get(
            "1303765683703910501"
          ); // Замените на ID роли для снятия

          if (roleToAdd) await member.roles.add(roleToAdd);
          if (roleToRemove) await member.roles.remove(roleToRemove);

          // Лог одобрения с улучшенным форматированием
          await buttonInteraction.update({
            content:
              `**✅ Заявка одобрена!**\n\n` +
              `**Игрок**: @${userTag}\n\n` +
              `**📋 Содержание заявки:**\n` +
              `\`\`\`diff\n` +
              `+ Никнейм: ${nickname}\n` +
              `+ Цели: ${goals}\n` +
              `+ Время: ${time}\n` +
              `+ Источник: ${source}\n` +
              `+ О себе: ${about}\n` +
              `\`\`\`\n` +
              `🎉 Роль успешно выдана и старая роль снята.`,
            components: [],
          });
        } else if (buttonInteraction.customId === "decline") {
          // Отклонение заявки
          const user = await client.users.fetch(interaction.user.id);
          await user.send("Ваша заявка была отклонена, попробуйте ещё раз.");

          // Лог отклонения с улучшенным форматированием
          await buttonInteraction.update({
            content:
              `**❌ Заявка отклонена**\n\n` +
              `**Игрок**: @${userTag}\n\n` +
              `**📋 Содержание заявки:**\n` +
              `\`\`\`diff\n` +
              `- Никнейм: ${nickname}\n` +
              `- Цели: ${goals}\n` +
              `- Время: ${time}\n` +
              `- Источник: ${source}\n` +
              `- О себе: ${about}\n` +
              `\`\`\`\n` +
              `👋 Попробуйте подать заявку снова.`,
            components: [],
          });
        }
      });
    }
  }
});

// Сообщение с кнопкой подачи заявки
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.commandName === "start") {
    // Проверка на наличие прав администратора
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content:
          "У вас нет прав администратора для использования этой команды.",
        ephemeral: true,
      });
    }

    // Если у пользователя есть права администратора, выполняем команду
    await interaction.reply({
      content: "Нажмите на кнопку, чтобы подать заявку.",
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("apply_button")
            .setLabel("Подать заявку")
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });
  }
});

client.login(process.env.TOKEN);
