const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, MessageFlags } = require('discord.js');
const { renderBoard, createButtons, disableAllButtons, checkWinner, minimax } = require('./gameUtils');

async function handleInteraction(interaction, games, arenas, invites) {
    if (!interaction.isChatInputCommand()) {
        if (interaction.isButton()) await handleButton(interaction, games, arenas, invites);
        return;
    }

    const { commandName, options, channelId, guild, client } = interaction;

    if (commandName === 'xo') {
        const subcommand = options.getSubcommand();

        if (subcommand === 'create-room') {
            let arenaChannel = arenas.get(guild.id);
            if (arenaChannel) {
                const channelExists = guild.channels.cache.get(arenaChannel.id);
                if (channelExists) {
                    return await interaction.reply(`**⚔️ สนามรบมีอยู่แล้ว!** เข้าไปที่ ${arenaChannel} เพื่อเริ่มสงคราม!`);
                } else {
                    arenas.delete(guild.id);
                }
            }
            try {
                await interaction.deferReply();
                const existingChannel = guild.channels.cache.find(channel => channel.name === 'xo-arena');
                if (existingChannel) {
                    arenas.set(guild.id, existingChannel);
                    const message = await existingChannel.send({
                        content: `**🔥 สนามรบ Tic-Tac-Toe พร้อมแล้ว! 🔥**\nกดปุ่มด้านล่างเพื่อเริ่มเกม!`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('start_game')
                                    .setLabel('เริ่มเกม')
                                    .setStyle(ButtonStyle.Success)
                            ),
                        ],
                    });
                    games.set(existingChannel.id, { 
                        channelId: existingChannel.id, 
                        messageId: message.id, 
                        status: 'waiting' 
                    });
                    await interaction.editReply(`**⚔️ ใช้สนามรบเดิม!** เข้าไปที่ ${existingChannel} เพื่อเริ่มต่อสู้!`);
                } else {
                    const channel = await guild.channels.create({
                        name: 'xo-arena',
                        type: 0,
                        permissionOverwrites: [
                            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                        ],
                    });
                    arenas.set(guild.id, channel);
                    const message = await channel.send({
                        content: `**🔥 สนามรบ Tic-Tac-Toe พร้อมแล้ว! 🔥**\nกดปุ่มด้านล่างเพื่อเริ่มเกม!`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('start_game')
                                    .setLabel('เริ่มเกม')
                                    .setStyle(ButtonStyle.Success)
                            ),
                        ],
                    });
                    games.set(channel.id, { 
                        channelId: channel.id, 
                        messageId: message.id, 
                        status: 'waiting' 
                    });
                    await interaction.editReply(`**⚔️ สนามรบพร้อม!** เข้าไปที่ ${channel} เพื่อเริ่มต่อสู้!`);
                }
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการสร้างหรือใช้สนามรบ:', error);
                await interaction.editReply('ไม่สามารถสร้างหรือใช้สนามรบได้ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
            }
        } else if (subcommand === 'invite') {
            const user = options.getUser('user');
            const arenaChannel = arenas.get(guild.id);
            if (!arenaChannel) {
                return await interaction.reply('**❌ ยังไม่มีสนามรบ!** ใช้ `/xo create-room` เพื่อสร้างก่อน');
            }
            const channelExists = guild.channels.cache.get(arenaChannel.id);
            if (!channelExists) {
                arenas.delete(guild.id);
                return await interaction.reply('**❌ สนามรบหายไป!** ใช้ `/xo create-room` เพื่อสร้างใหม่');
            }
            if (user.id === interaction.user.id) {
                return await interaction.reply({ content: 'คุณไม่สามารถเชิญตัวเองได้!', flags: MessageFlags.Ephemeral });
            }
            try {
                const inviteMessage = await arenaChannel.send({
                    content: `**🔔 ${interaction.user.username} ได้เชิญ ${user.username} เข้าสู่สนามรบ!**\nกดปุ่มด้านล่างเพื่อตอบรับหรือปฏิเสธ!`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('accept_invite')
                                .setLabel('ตอบรับ')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('decline_invite')
                                .setLabel('ปฏิเสธ')
                                .setStyle(ButtonStyle.Danger)
                        ),
                    ],
                });
                invites.set(inviteMessage.id, {
                    inviter: interaction.user,
                    invitee: user,
                    channelId: arenaChannel.id,
                });
                await interaction.reply({ content: `**🔔 ได้ส่งคำเชิญถึง ${user.username} แล้ว!** รอการตอบกลับใน ${arenaChannel}`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเชิญ:', error);
                await interaction.reply({ content: 'ไม่สามารถส่งคำเชิญได้ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์', flags: MessageFlags.Ephemeral });
            }
        }
    }
}

async function handleButton(interaction, games, arenas, invites) {
    try {
        await interaction.deferUpdate({ withResponse: false });

        const channelId = interaction.channelId;
        let game = games.get(channelId);

        if (interaction.customId === 'start_game') {
            if (!game || game.status !== 'waiting') {
                return;
            }
            const board = Array(9).fill(null);
            if (game.inviter && game.invitee) {
                game = {
                    board,
                    currentPlayer: 'X',
                    playerX: game.inviter,
                    playerO: game.invitee,
                    status: 'ongoing',
                    mode: 'pvp',
                    channelId: channelId,
                    turns: 0,
                    messageId: game.messageId,
                    rounds: { playerX: 0, playerO: 0 },
                    currentRound: 1,
                };
            } else {
                game = {
                    board,
                    currentPlayer: 'X',
                    playerX: interaction.user,
                    playerO: interaction.client.user,
                    status: 'ongoing',
                    mode: 'pve',
                    channelId: channelId,
                    turns: 0,
                    messageId: game.messageId,
                    rounds: { playerX: 0, playerO: 0 },
                    currentRound: 1,
                };
            }
            games.set(channelId, game);
            try {
                const channel = await interaction.client.channels.fetch(channelId);
                const message = await channel.messages.fetch(game.messageId);
                await message.edit({
                    content: `**🔥 สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**❌ ตาของ ${game.playerX.username}! เลือกตำแหน่งด้วยปุ่มด้านล่างเลย! 🔥**`,
                    components: createButtons(game),
                });
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเริ่มเกม:', error);
            }
            return;
        }

        if (interaction.customId === 'accept_invite' || interaction.customId === 'decline_invite') {
            const invite = invites.get(interaction.message.id);
            if (!invite) {
                return;
            }
            if (interaction.user.id !== invite.invitee.id) {
                return;
            }
            const channel = await interaction.client.channels.fetch(invite.channelId);
            if (interaction.customId === 'accept_invite') {
                try {
                    await channel.permissionOverwrites.edit(invite.invitee, {
                        ViewChannel: true,
                        SendMessages: true,
                    });
                    if (games.get(channel.id)) {
                        games.delete(channel.id);
                    }
                    const message = await channel.send({
                        content: `**🔥 สนามรบ Tic-Tac-Toe พร้อมแล้ว! 🔥**\nกดปุ่มด้านล่างเพื่อเริ่มเกม PvP ระหว่าง ${invite.inviter.username} และ ${invite.invitee.username}!`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder()
                                    .setCustomId('start_game')
                                    .setLabel('เริ่มเกม')
                                    .setStyle(ButtonStyle.Success)
                            ),
                        ],
                    });
                    games.set(channel.id, {
                        status: 'waiting',
                        channelId: channel.id,
                        messageId: message.id,
                        inviter: invite.inviter,
                        invitee: invite.invitee,
                        mode: 'pvp',
                    });
                    await interaction.message.edit({
                        content: `**✅ ${invite.invitee.username} ตอบรับคำเชิญจาก ${invite.inviter.username}!**`,
                        components: [],
                    });
                } catch (error) {
                    console.error('เกิดข้อผิดพลาดในการเริ่มเกม PvP:', error);
                    await interaction.followUp({ content: 'ไม่สามารถเริ่มเกม PvP ได้ เกิดข้อผิดพลาด!', ephemeral: true });
                }
            } else {
                try {
                    await channel.send(`**❌ ${invite.invitee.username} ปฏิเสธการรบ!**`);
                    await interaction.message.edit({
                        content: `**❌ ${invite.invitee.username} ปฏิเสธคำเชิญจาก ${invite.inviter.username}!**`,
                        components: [],
                    });
                } catch (error) {
                    console.error('เกิดข้อผิดพลาดในการปฏิเสธคำเชิญ:', error);
                    await interaction.followUp({ content: 'ไม่สามารถปฏิเสธคำเชิญได้ เกิดข้อผิดพลาด!', ephemeral: true });
                }
            }
            invites.delete(interaction.message.id);
            return;
        }

        if (interaction.customId === 'start_new_game') {
            const arenaChannel = arenas.get(interaction.guild.id);
            if (!arenaChannel) {
                return;
            }
            const channel = await interaction.client.channels.fetch(arenaChannel.id);
            if (!channel) {
                arenas.delete(interaction.guild.id);
                return;
            }
            const board = Array(9).fill(null);
            game = {
                board,
                currentPlayer: 'X',
                playerX: interaction.user,
                playerO: interaction.client.user,
                status: 'ongoing',
                mode: 'pve',
                channelId: arenaChannel.id,
                turns: 0,
                messageId: null,
                rounds: { playerX: 0, playerO: 0 },
                currentRound: 1,
            };
            games.set(arenaChannel.id, game);
            try {
                const messages = await channel.messages.fetch({ limit: 1 });
                const latestMessage = messages.first();
                if (latestMessage) {
                    game.messageId = latestMessage.id;
                    await latestMessage.edit({
                        content: `**🔥 สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**❌ ตาของ ${game.playerX.username}! เลือกตำแหน่งด้วยปุ่มด้านล่างเลย! 🔥**`,
                        components: createButtons(game),
                    });
                } else {
                    const message = await channel.send({
                        content: `**🔥 สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**❌ ตาของ ${game.playerX.username}! เลือกตำแหน่งด้วยปุ่มด้านล่างเลย! 🔥**`,
                        components: createButtons(game),
                    });
                    game.messageId = message.id;
                }
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเริ่มเกมใหม่:', error);
            }
            return;
        }

        if (interaction.customId === 'start_new_round') {
            if (!game || game.status !== 'finished') {
                return;
            }
            try {
                const channel = await interaction.client.channels.fetch(channelId);
                const message = await channel.messages.fetch(game.messageId);
                game.board = Array(9).fill(null);
                game.currentPlayer = 'X';
                game.status = 'ongoing';
                game.turns = 0;
                game.currentRound++;
                games.set(channelId, game);
                await message.edit({
                    content: `**🔥 รอบ ${game.currentRound}/3: สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**❌ ตาของ ${game.playerX.username}! เลือกตำแหน่งด้วยปุ่มด้านล่างเลย! 🔥**`,
                    components: createButtons(game),
                });
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเริ่มรอบใหม่:', error);
            }
            return;
        }

        if (interaction.customId === 'cancel_game') {
            if (!game || game.status !== 'ongoing') {
                return;
            }
            try {
                const channel = await interaction.client.channels.fetch(channelId);
                const message = await channel.messages.fetch(game.messageId);
                games.delete(channelId);
                await message.edit({
                    content: `**🔥 สนามรบ Tic-Tac-Toe พร้อมแล้ว! 🔥**\nกดปุ่มด้านล่างเพื่อเริ่มเกม!`,
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('start_game')
                                .setLabel('เริ่มเกม')
                                .setStyle(ButtonStyle.Success)
                        ),
                    ],
                });
                games.set(channelId, { 
                    channelId: channel.id, 
                    messageId: message.id, 
                    status: 'waiting' 
                });
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการยกเลิกเกม:', error);
            }
            return;
        }

        if (!game || game.status !== 'ongoing' || (game.currentPlayer === 'X' && game.playerX.id !== interaction.user.id) || (game.currentPlayer === 'O' && game.playerO.id !== interaction.user.id)) {
            return;
        }

        const position = parseInt(interaction.customId) - 1;
        if (game.board[position] !== null) {
            return;
        }

        game.board[position] = game.currentPlayer;
        game.turns++;
        const result = checkWinner(game.board);
        const channel = await interaction.client.channels.fetch(channelId);
        try {
            const message = await channel.messages.fetch(game.messageId);
            if (result) {
                game.status = 'finished';
                let reply;
                let components;
                let finalReply = '';
                if (result === 'draw') {
                    reply = `**⚔️ รอบ ${game.currentRound}/3: เสมอ! ⚔️**\nคะแนน: ${game.playerX.username} ${game.rounds.playerX} - ${game.rounds.playerO} ${game.playerO.username}`;
                } else {
                    const winner = result === 'X' ? game.playerX : game.playerO;
                    game.rounds[result === 'X' ? 'playerX' : 'playerO']++;
                    reply = `**🏆 รอบ ${game.currentRound}/3: ${winner.username} ชนะ!**\nคะแนน: ${game.playerX.username} ${game.rounds.playerX} - ${game.rounds.playerO} ${game.playerO.username}`;
                }
                if (game.mode === 'pvp' && game.currentRound < 3 && game.rounds.playerX < 2 && game.rounds.playerO < 2) {
                    components = [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('start_new_round')
                                .setLabel('เริ่มรอบใหม่')
                                .setStyle(ButtonStyle.Success)
                        ),
                    ];
                } else {
                    if (game.rounds.playerX >= 2) {
                        finalReply = `**🏆 ${game.playerX.username} ชนะการแข่งขัน 2/3! 🏆**`;
                    } else if (game.rounds.playerO >= 2) {
                        finalReply = `**🏆 ${game.playerO.username} ชนะการแข่งขัน 2/3! 🏆**`;
                    } else {
                        finalReply = `**⚔️ การแข่งขันจบลงด้วยผลเสมอ! ⚔️**`;
                    }
                    components = [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId('start_new_game')
                                .setLabel('เริ่มเกมใหม่')
                                .setStyle(ButtonStyle.Success)
                        ),
                    ];
                    games.delete(channelId);
                }
                await message.edit({
                    content: `**🏆 ผลลัพธ์รอบ ${game.currentRound}/3 🏆**\n${renderBoard(game)}\n${reply}\n${finalReply}`,
                    components,
                });
                return;
            }

            game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
            games.set(channelId, game);
            if (game.mode === 'pve' && game.currentPlayer === 'O') {
                await message.edit({
                    content: `**🔥 สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**⭕ Bot กำลังโจมตี! รอการตอบโต้...**`,
                    components: createButtons(game),
                });
                await aiMove(game, interaction.guild, channel, games);
            } else {
                await message.edit({
                    content: `**🔥 รอบ ${game.currentRound}/3: สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**${game.currentPlayer === 'X' ? '❌' : '⭕'} ตาของ ${game.currentPlayer === 'X' ? game.playerX.username : game.playerO.username}! เลือกตำแหน่งด้วยปุ่มด้านล่างเลย! 🔥**`,
                    components: createButtons(game),
                });
            }
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการแก้ไขข้อความ:', error);
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดใน handleButton:', error);
        if (!interaction.deferred && !interaction.replied) {
            await interaction.followUp({ content: 'เกิดข้อผิดพลาดในการประมวลผลปุ่ม!', ephemeral: true }).catch(() => {});
        }
    }
}

async function aiMove(game, guild, channel, games) {
    const { board, channelId } = game;
    const { move } = minimax(board, 0, true);
    game.board[move] = 'O';
    game.turns++;
    const result = checkWinner(game.board);
    try {
        const message = await channel.messages.fetch(game.messageId);
        if (result) {
            game.status = 'finished';
            const reply = result === 'draw' ? '**⚔️ รอบ 1/3: สงครามจบลงด้วยผลเสมอ! ⚔️**' : `**⭕  Bot ครองชัย!**`;
            const components = [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('start_new_game')
                        .setLabel('เริ่มเกมใหม่')
                        .setStyle(ButtonStyle.Success)
                ),
            ];
            await message.edit({
                content: `**🏆 ผลลัพธ์รอบ 1/3 🏆**\n${renderBoard(game)}\n${reply}`,
                components,
            });
            games.delete(channelId);
            return;
        }

        game.currentPlayer = 'X';
        games.set(channelId, game);
        await message.edit({
            content: `**🔥 สนามรบ Tic-Tac-Toe 🔥**\n${renderBoard(game)}\n**❌ ตาของ ${game.playerX.username}! เลือกตำแหน่งด้วยปุ่มด้านล่างเลย! 🔥**`,
            components: createButtons(game),
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการแก้ไขข้อความ:', error);
    }
}

module.exports = { handleInteraction };