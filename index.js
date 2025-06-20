const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { handleInteraction } = require('./interactions');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const games = new Collection();
const arenas = new Collection();
const invites = new Collection();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    for (const guild of client.guilds.cache.values()) {
        const existingChannel = guild.channels.cache.find(channel => channel.name === 'xo-arena');
        if (existingChannel) {
            arenas.set(guild.id, existingChannel);
            console.log(`พบช่อง xo-arena ในเซิร์ฟเวอร์ ${guild.name} (ID: ${existingChannel.id})`);
        }
    }
});

client.on('interactionCreate', async interaction => {
    try {
        await handleInteraction(interaction, games, arenas, invites);
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});

client.login(process.env.BOT_TOKEN);