#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write --allow-env

/**
 * USAGE:
 * 		./bin/deploy.ts [major|minor|patch]
 *
 * DESCRIPTION:
 * 		- バージョンアップを行うスクリプト
 * 		- バージョンアップの種類を指定しない場合は、
 * 		  最新のタグが patch バージョンを持っている場合は patch、
 * 		  そうでない場合は minor バージョンアップを行う
 */

import $ from "jsr:@david/dax@0.42.0";
import * as colors from "https://deno.land/std@0.203.0/fmt/colors.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const versionUpSchema = z.enum(["major", "minor", "patch"]);
type VersionUp = z.infer<typeof versionUpSchema>;

/**
 * package.json からバージョンを取得する
 */
async function getLatestVersion(): Promise<`${number}.${number}.${number}`> {
	const content = await Deno.readTextFile("package.json");
	const json = JSON.parse(content);
	return json.version;
}

/**
 * バージョンを表す構造体
 */
type Version = {
	major: number;
	minor: number;
	patch: number;
};
type VersionString = `${number}.${number}.${number}`;
type VersionTagString = `v${VersionString}`;
/**
 * Version 構造体を major.minor.patch の形式の文字列に変換する
 */
function stringifyVersion(version: Version): VersionString {
	const { major, minor, patch } = version;
	return `${major}.${minor}.${patch}`;
}

/**
 * major.minor.patch の形式の文字列を Version 構造体に変換する
 */
function parseVersion(version: VersionString): Version {
	const [major, minor, patch] = version
		.split(".")
		.map((v) => Number(v))
		.map((v) => (Number.isNaN(v) ? undefined : v));

	if (major === undefined || minor === undefined || patch === undefined) {
		console.error(colors.red("[ERROR]"), "invalid version:", version);
		Deno.exit(1);
	}

	return { major, minor, patch };
}

/**
 * versionUp で指定されたバージョンアップをした構造体を返す
 */
function bumpVersion(version: Version, versionUp: VersionUp): Version {
	const { major, minor, patch } = version;

	switch (versionUp) {
		case "major":
			return { major: major + 1, minor: 0, patch: 0 };
		case "minor":
			return { major, minor: minor + 1, patch: 0 };
		case "patch": {
			return { major, minor, patch: patch + 1 };
		}
	}
}

/**
 * git diff で dist 以外に変更があった場合はエラーを出力して終了する
 */
async function checkDiff() {
	const output =
		await $`git diff --name-only HEAD -- ":(exclude)dist/*"`.text();
	if (output.trim() === "") {
		return;
	}

	console.error(colors.red("[ERROR]"), "diff found:\n", output);
	Deno.exit(1);
}

/**
 * v*.*.* の形式のタグをパースして Version 構造体に変換する
 */
function parseTag(tag: VersionTagString): Version {
	if (!tag.startsWith("v")) {
		console.error(colors.red("[ERROR]"), "invalid tag:", tag);
		Deno.exit(1);
	}

	return parseVersion(tag.replace(/^v/, "") as VersionString);
}
/**
 * Version 構造体を v*.*.* の形式の文字列に変換する
 */
function stringifyTag(version: Version): VersionTagString {
	return `v${stringifyVersion(version)}`;
}

/**
 * npm run bundle で dist ディレクトリを更新する
 */
async function runBundle() {
	await $`npm run bundle`;
}

/**
 * package.json の version を newVersion に更新する
 */
async function updatePackageJson(newVersion: Version) {
	const content = await Deno.readTextFile("package.json");
	const json = JSON.parse(content);
	json.version = stringifyVersion(newVersion);
	await Deno.writeTextFile("package.json", JSON.stringify(json, null, 2));

	await $`npm run fix`;
}

/**
 * README.md 内の @v1 のように指定されたバージョンを更新する
 *
 * README.md には major バージョンでの指定しか書かない
 */
async function updateReadme(newVersion: Version) {
	// like SSlime-s/traq-webhook@v1 format
	const content = await Deno.readTextFile("README.md");
	const regex = /SSlime-s\/traq-webhook@v\d+/g;

	const newContent = content.replace(
		regex,
		`SSlime-s/traq-webhook@v${newVersion.major}`,
	);
	await Deno.writeTextFile("README.md", newContent);
}

// ---------------------------------
// ここまで関数定義
// ---------------------------------

await checkDiff();

const args = Deno.args;

const latestVersion = await getLatestVersion();
const parsedLatestTag = parseVersion(latestVersion);

let versionUp: VersionUp;
if (args.length > 0) {
	const res = versionUpSchema.safeParse(args[0]);
	if (!res.success) {
		console.error(colors.red("[ERROR]"), res.error);
		Deno.exit(1);
	}

	versionUp = res.data;
} else {
	console.error(colors.yellow("[ERROR]"), "version up type is not specified");
	Deno.exit(1);
}

const newVersion = bumpVersion(parsedLatestTag, versionUp);

console.log(
	colors.green("[INFO]"),
	"new version:",
	stringifyVersion(newVersion),
);

await runBundle();

await updatePackageJson(newVersion);
await updateReadme(newVersion);

await $`git add README.md package.json dist`;

const newTag = stringifyTag(newVersion);

const commitMessage = `🎉 bump version (${newTag})`;

await $`git commit -m ${commitMessage}`;

await $`git tag ${newTag}`;

await $`git push`;
await $`git push --tags`;
