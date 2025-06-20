const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const EMPTY = '⬜';
const X = '❌';
const O = '⭕';

function renderBoard(game) {
    const { board } = game;
    let display = '```css\n';
    display += '╔═════╦═════╦═════╗\n';
    for (let i = 0; i < 9; i += 3) {
        display += `║ ${board[i] || EMPTY}   ║ ${board[i + 1] || EMPTY}   ║ ${board[i + 2] || EMPTY}   ║\n`;
        if (i < 6) display += '╠═════╬═════╬═════╣\n';
    }
    display += '╚═════╩═════╩═════╝\n';
    display += '```\n';
    return display;
}

function createButtons(game) {
    const rows = [];
    for (let i = 0; i < 9; i += 3) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const pos = i + j + 1;
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(pos.toString())
                    .setLabel(game.board[pos - 1] || pos.toString())
                    .setStyle(game.board[pos - 1] === 'X' ? ButtonStyle.Danger : game.board[pos - 1] === 'O' ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(game.board[pos - 1] !== null || game.status !== 'ongoing')
            );
        }
        rows.push(row);
    }
    if (game.status === 'ongoing') {
        const cancelRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cancel_game')
                .setLabel('ยกเลิกการเล่น')
                .setStyle(ButtonStyle.Danger)
        );
        rows.push(cancelRow);
    }
    return rows;
}

function disableAllButtons(game) {
    const rows = [];
    for (let i = 0; i < 9; i += 3) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const pos = i + j + 1;
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(pos.toString())
                    .setLabel(game.board[pos - 1] || pos.toString())
                    .setStyle(game.board[pos - 1] === 'X' ? ButtonStyle.Danger : game.board[pos - 1] === 'O' ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        }
        rows.push(row);
    }
    return rows;
}

function checkWinner(board) {
    const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (!board.includes(null)) return 'draw';
    return null;
}

function minimax(board, depth, isMaximizing) {
    const result = checkWinner(board);
    if (result === 'X') return { score: -10 + depth };
    if (result === 'O') return { score: 10 - depth };
    if (result === 'draw') return { score: 0 };

    if (isMaximizing) {
        let bestScore = -Infinity;
        let bestMove;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false).score;
                board[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return { score: bestScore, move: bestMove };
    } else {
        let bestScore = Infinity;
        let bestMove;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true).score;
                board[i] = null;
                if (score < bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return { score: bestScore, move: bestMove };
    }
}

module.exports = { renderBoard, createButtons, disableAllButtons, checkWinner, minimax };