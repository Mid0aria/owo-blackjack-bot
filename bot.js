/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/*
 * OwO BlackJack Bot
 * Copyright (C) 2024 Mido
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
 */

const cp = require("child_process");

const config = require("./config.json");

// auto install dependencies
const isTermux =
    process.env.PREFIX && process.env.PREFIX.includes("com.termux");
const packageJson = require("./package.json");

for (let dep of Object.keys(packageJson.dependencies)) {
    if (isTermux && (dep === "puppeteer" || dep === "puppeteer-real-browser")) {
        console.log("Skipping Puppeteer in Termux environment");
        continue;
    }

    try {
        require.resolve(dep);
    } catch (err) {
        console.log(`Installing dependencies...`);
        try {
            cp.execSync(`npm install ${dep}`, { stdio: "inherit" });
        } catch (installErr) {
            console.error(`Failed to install ${dep}:`, installErr.message);
        }
    }
}

const additionalDeps = ["puppeteer", "puppeteer-real-browser"];

for (let dep of additionalDeps) {
    if (isTermux) {
        console.log(`Termux environment detected. Skipping ${dep}.`);
        continue;
    }

    try {
        require.resolve(dep);
    } catch (err) {
        console.log(`${dep} is not installed. Installing ${dep}...`);
        try {
            cp.execSync(`npm install ${dep}`, { stdio: "inherit" });
        } catch (installErr) {
            console.error(`Failed to install ${dep}:`, installErr.message);
        }
    }
}

const fs = require("fs");
const chalk = require("chalk");
const globalutil = require("./utils/globalutil.js");
const { getRandomBanner } = require("./utils/banner.js");
const { logger } = require("./utils/logger.js");

//client
const { Client, Collection, RichPresence } = require("discord.js-selfbot-v13");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

process.title = `OwO Blackjack Bot v${packageJson.version}`;

if (!fs.existsSync("./tokens.json")) {
    logger.alert("Bot", "Startup", "tokens.json not found.");
    process.exit(1);
}

(async () => {
    console.log(getRandomBanner());
    await globalutil.checkUpdate(logger, cp, packageJson);
    for (const { token, channelId } of require("./tokens.json")) {
        const client = new Client();

        let owoblackjackbot = {
            username: "",
            istermux: isTermux,
            captchadetected: false,
            paused: true,
            started: false,
            total: {
                captcha: 0,
                blackjack: 0,
                win: 0,
                lose: 0,
                draw: 0,
                bet: 0,
            },
        };

        client.chalk = chalk;
        client.fs = fs;
        client.childprocess = cp;
        client.config = config;
        client.delay = delay;
        client.global = owoblackjackbot;
        client.rpc = rpc;
        client.logger = logger;
        client.globalutil = globalutil;
        client.token = token;
        client.blackjackchannelid = channelId;

        function rpc(type) {
            let status = new RichPresence(client)
                .setApplicationId("1253757665520259173")
                .setType("PLAYING")
                .setName("OwO BlackJack Bot")
                .setDetails("Auto Gambling")
                .setState(`${client.global.paused ? "Paused" : "Running"}`)
                .setStartTimestamp(Date.now())
                .setAssetsLargeImage("1253758464816054282")
                .setAssetsLargeText("OwO BlackJack Bot")
                .addButton(
                    "BlackJack Bot",
                    "https://github.com/Mid0aria/owo-blackjack-bot",
                )
                .addButton("Discord", "https://discord.gg/WzYXVbXt6C");

            if (config.discordrpc) {
                client.user.setPresence({ activities: [status] });
            }
        }

        ["aliases", "commands"].forEach((x) => (client[x] = new Collection()));

        fs.readdirSync("./handlers").forEach((file) => {
            require(`./handlers/${file}`)(client);
        });

        try {
            logger.warn("Bot", "Startup", "Logging in...");
            await client.login(token);
        } catch (error) {
            logger.error("Bot", "Login", `Invalid Token: ${token}`);
        }
    }

    logger.warn(
        "Bot",
        "Help",
        `Use \"${config.prefix}start\" to start the bot, \"${config.prefix}resume\" to resume, and \"${config.prefix}pause\" to pause.`,
    );
})();
