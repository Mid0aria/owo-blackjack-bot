/*
 * OwO BlackJack Bot
 * Copyright (C) 2024 Mido
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
 */

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { logger } = require("./logger.js");

let qValues;

module.exports = (client) => {
    let channel = client.channels.cache.get(client.blackjackchannelid);
    blackjack(client, channel);
};

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const commandrandomizer = (arr) => arr[Math.floor(Math.random() * arr.length)];

const sendmessage = async (channel, message) => {
    channel.sendTyping();
    await delay(getRandomInt(500, 3000));
    return channel.send(message);
};

const getQValues = () => {
    try {
        const data = fs.readFileSync(
            path.join(__dirname, "./q_values.json"),
            "utf-8",
        );
        const qValues = JSON.parse(data);

        const config = {
            q_values: qValues,
        };

        return config.q_values;
    } catch (error) {
        console.error("Error loading Q-values:", error);
    }
};

qValues = getQValues();

const getBestAction = (dealerShow, playerSum, hasAce) => {
    const stateKey = JSON.stringify([dealerShow, playerSum, hasAce]).replace(
        /,/g,
        ", ",
    );
    const currentQValues = qValues[stateKey];

    if (currentQValues) {
        return currentQValues.indexOf(Math.max(...currentQValues));
    } else {
        return getRandomInt(0, 1);
    }
};

async function blackjack(client, channel) {
    await sendmessage(
        channel,
        `${commandrandomizer([
            "owo",
            client.config.owoprefix,
        ])} ${commandrandomizer(["blackjack", "bj", "21"])} ` +
            client.config.BET_AMOUNT,
    );

    const filter = (msg) => {
        return (
            msg.author.id === "408785106942164992" &&
            msg.embeds.length > 0 &&
            (msg.embeds[0].author?.name.includes(msg.client.user?.username) ??
                false) &&
            (msg.embeds[0].author?.name.includes("blackjack") ?? false)
        );
    };

    const collectorOptions = {
        filter: filter,
        max: 1,
        time: 15000,
    };

    const collector = channel.createMessageCollector(collectorOptions);

    collector
        .on("collect", async (collectedMsg) => {
            await delay(getRandomInt(2000, 4300));

            await handleblackjack(client, collectedMsg);

            await delay(getRandomInt(16000, 34000));

            blackjack(client, channel);
        })
        .once("end", async (collected) => {
            if ([...collected].length === 0) {
                await delay(getRandomInt(18000, 32000));

                blackjack(client, channel);
            }
        });
}

const handleblackjack = async (client, message) => {
    let reactionToRemove1;
    let reactionToRemove2;

    try {
        await delay(getRandomInt(600, 1200));

        const dealerShowMatch =
            message.embeds[0].fields[0].name.match(/`\[(\d+).*\]\*?`/);

        const dealerShow = dealerShowMatch?.[1];

        const playerSumMatch =
            message.embeds[0].fields[1].name.match(/`\[(\d+)\]\*?`/);
        const playerSum = playerSumMatch?.[1];

        if (!playerSum || !dealerShow) {
            throw new Error("Could Not Retrieve Blackjack Cards");
        }

        if (message.embeds[0].color === 8240363) {
            const actionIndex = getBestAction(
                Number(dealerShow),
                Number(playerSum),
                message.embeds[0].fields[1].name.includes("*") ? 1 : 0,
            );

            await delay(getRandomInt(500, 1500));

            const reactions = message.reactions;

            if (
                actionIndex === 1 &&
                reactions.cache.find((reaction) => reaction.emoji.name == "👊")
                    ?.me
            ) {
                reactionToRemove1 = reactions.cache.find(
                    (reaction) => reaction.emoji.name == "👊",
                );
                (await reactionToRemove1) === null ||
                reactionToRemove1 === undefined
                    ? undefined
                    : reactionToRemove1.users.remove(reactions.client.user);
            } else if (
                actionIndex === 0 &&
                reactions.cache.find((reaction) => reaction.emoji.name == "🛑")
                    ?.me
            ) {
                reactionToRemove2 = reactions.cache.find(
                    (reaction) => reaction.emoji.name == "🛑",
                );
                (await reactionToRemove2) === null ||
                reactionToRemove2 === undefined
                    ? undefined
                    : reactionToRemove2.users.remove(reactions.client.user);
            } else {
                await message.react(actionIndex === 1 ? "👊" : "🛑");
            }

            await delay(getRandomInt(500, 1000));

            const updatedMessage = await message.channel.messages.fetch(
                message.id,
            );

            await handleblackjack(client, updatedMessage);
        } else {
            client.global.total.bet += 1;

            if (message.embeds[0].color === 16711680) {
                logger.alert(
                    `${client.user.username}`,
                    chalk.underline.redBright(
                        "Lost " + client.config.BET_AMOUNT + " cash",
                    ),
                    chalk.white(
                        ` Player: ${
                            Number(playerSum) > 21
                                ? chalk.underline.redBright(playerSum)
                                : chalk.underline.greenBright(playerSum)
                        } | Dealer: ${
                            Number(dealerShow) > 21
                                ? chalk.underline.redBright(dealerShow)
                                : chalk.underline.greenBright(dealerShow)
                        }`,
                    ),
                );
                client.global.total.lose += 1;
            } else if (message.embeds[0].color === 65280) {
                logger.info(
                    `${client.user.username}`,
                    chalk.underline.greenBright(
                        "Won " + client.config.BET_AMOUNT + " cash",
                    ),
                    chalk.white(
                        ` Player: ${
                            Number(playerSum) > 21
                                ? chalk.underline.redBright(playerSum)
                                : chalk.underline.greenBright(playerSum)
                        } | Dealer: ${
                            Number(dealerShow) > 21
                                ? chalk.underline.redBright(dealerShow)
                                : chalk.underline.greenBright(dealerShow)
                        }`,
                    ),
                );

                client.global.total.win += 1;
            } else {
                logger.warn(
                    `${client.user.username}`,
                    chalk.underline.gray(
                        "Draw " + client.config.BET_AMOUNT + " cash",
                    ),
                    chalk.white(
                        ` Player: ${chalk.underline.gray(playerSum)} | Dealer: ${chalk.underline.gray(dealerShow)}`,
                    ),
                );
                client.global.total.draw += 1;
            }
        }
    } catch (error) {
        console.log(error);
    }
};
