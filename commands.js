const { SlashCommandBuilder, REST, Routes } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('xo')
        .setDescription('ท้าทายในสนาม Tic-Tac-Toe สุดเดือด!')
        .addSubcommand(subcommand =>
            subcommand.setName('create-room').setDescription('สร้างสนามรบ XO'))
        .addSubcommand(subcommand =>
            subcommand.setName('invite')
                .setDescription('เชิญนักรบคนอื่นเข้าร่วมสนามรบ')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('เลือกนักรบที่จะเชิญ')
                        .setRequired(true))),
].map(command => command.toJSON());

async function refreshCommands(clientId, token) {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการรีเฟรชคำสั่ง:', error);
    }
}

module.exports = { commands, refreshCommands };