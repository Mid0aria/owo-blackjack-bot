/*
 * OwO BlackJack Bot
 * Copyright (C) 2024 Mido
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
 */

function isWebCaptchaMessage(msgcontent, helloChristopher, canulickmymonster) {
    const suspiciousPhrases = [".com", "please use the link"];

    const hasSuspiciousContent = suspiciousPhrases.some((phrase) =>
        msgcontent.includes(phrase),
    );

    return hasSuspiciousContent || helloChristopher || canulickmymonster;
}

module.exports = async (client, message) => {
    if (
        message.author.id === "408785106942164992" &&
        message.channel.id === client.blackjackchannelid
    ) {
        let rawmsgcontent = message.content.toLowerCase();
        let msgcontent = client.globalutil.removeInvisibleChars(rawmsgcontent);
        let helloChristopher, canulickmymonster;

        if (
            (msgcontent.includes("please complete your captcha") ||
                msgcontent.includes("verify that you are human") ||
                msgcontent.includes("are you a real human") ||
                msgcontent.includes(
                    "please use the link below so i can check",
                ) ||
                msgcontent.includes("captcha")) &&
            !client.global.captchadetected
        ) {
            client.global.paused = true;
            client.global.captchadetected = true;
            client.global.total.captcha++;
            client.logger.alert("Bot", "Captcha", `Captcha Detected!`);
            client.logger.info(
                "Bot",
                "Captcha",
                `Total Captcha: ${client.global.total.captcha}`,
            );
            client.logger.warn(
                "Bot",
                "Captcha",
                `Bot Paused: ${client.global.paused}`,
            );

            if (
                message.components.length > 0 &&
                message.components[0].components[0]
            ) {
                helloChristopher = message.components[0].components.find(
                    (button) => button.url.toLowerCase() === "owobot.com",
                );
                canulickmymonster = message.components[0].components[0].url
                    .toLowerCase()
                    .includes("owobot.com");
            }

            if (
                client.config.settings.captcha.alerttype.webhook &&
                client.config.settings.captcha.alerttype.webhookurl.length > 10
            ) {
                const { WebhookClient } = require("discord.js-selfbot-v13");
                const webhookClient = new WebhookClient({
                    url: client.config.settings.captcha.alerttype.webhookurl,
                });
                let message = `#Token ID: <@${client.user.id}>\nToken Infos: ${client.user.username}\n**🚨Captcha detected!🚨 Solve the captcha**`;

                await webhookClient.send({
                    content: `${message}\n||@everyone||`,
                    username: "OwO BlackJack Bot",
                });
            }

            if (
                isWebCaptchaMessage(
                    msgcontent,
                    helloChristopher,
                    canulickmymonster,
                )
            ) {
                switch (process.platform || client.global.istermux) {
                    case "android":
                        client.logger.warn(
                            "Bot",
                            "Captcha",
                            "Unsupported platform!",
                        );
                        return;
                    default:
                        client.logger.info(
                            "Bot",
                            "Captcha",
                            "Opening browser...",
                        );
                        client.childprocess.spawn("node", [
                            "./utils/captcha.js",
                            `--token=${client.token}`,
                        ]);
                        return;
                }
            }
        }
        if (msgcontent.includes("i have verified that you are human")) {
            client.global.captchadetected = false;

            client.global.paused = false;
            client.logger.warn(
                "Bot",
                "Captcha",
                `Captcha solved. Resuming bot automatically...`,
            );
        }
    }

    /**
     * CMD
     */
    let PREFIX = client.config.prefix;

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const prefixRegex = new RegExp(
        `^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`,
    );
    if (!prefixRegex.test(message.content)) return;
    const [matchedPrefix] = message.content.match(prefixRegex);
    const args = message.content
        .slice(matchedPrefix.length)
        .trim()
        .split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd =
        client.commands.get(command) ||
        client.commands.get(client.aliases.get(command));

    if (cmd) {
        const superUser = client.config.superuserid || client.user.id;
        if (message.author.id !== superUser) return;
        cmd.run(client, message, args);
    }
};
