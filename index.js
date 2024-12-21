const core = require("@actions/core");
const github = require("@actions/github");
const crypto = require("crypto");
const fetch = require("node-fetch");
const makeMessage = require("./utils/makeMessage");

/**
 * @param {string} message
 * @param {string} secret
 * @returns {string}
 */
function calcHMACSHA1(message, secret) {
	return crypto.createHmac("sha1", secret).update(message).digest("hex");
}

/**
 * core.getBooleanInput を使うと、default 値の指定がうまくいかないため、getInput で取ってパースする
 *
 * @param {typeof core} core
 * @param {string} name
 * @param {core.InputOptions} options
 * @returns {boolean}
 */
function getBooleanLikeInput(core, name, options) {
	const value = core.getInput(name, options);
	return (value || "true").toUpperCase() === "TRUE";
}

async function main() {
	const id = core.getInput("webhook-id");
	const secret = core.getInput("webhook-secret", { required: false });
	const channelId = core.getInput("channel-id", { required: false });
	const messageInput = core.getInput("message", { required: false }).trim();
	const isAutoGeneratedMessage = getBooleanLikeInput(
		core,
		"auto-generated-message",
		{ required: false },
	);
	const isEmbed = getBooleanLikeInput(core, "embed", { required: false });

	if (!isAutoGeneratedMessage && messageInput === "") {
		core.setFailed("message or auto-generated-message is required");
		return;
	}

	const context = github.context;
	const message = isAutoGeneratedMessage
		? makeMessage(core, context)
		: messageInput;

	if (typeof message !== "string") {
		core.setFailed("there is no message to send");
		return;
	}

	const webhookUrl = `https://q.trap.jp/api/v3/webhooks/${id}`;
	const url = isEmbed ? `${webhookUrl}?embed=1` : webhookUrl;

	const headers = { "Content-Type": "text/plain" };
	if (secret !== "-1") {
		headers["X-TRAQ-Signature"] = calcHMACSHA1(message, secret);
	}
	if (channelId !== "-1") {
		headers["X-TRAQ-Channel-Id"] = channelId;
	}
	await fetch(url, {
		method: "POST",
		body: message,
		headers,
	});
}

try {
	await main();
} catch (err) {
	core.setFailed(err.message);
}
