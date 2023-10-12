#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write
// deno-lint-ignore-file no-deprecated-deno-api

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import * as colors from "https://deno.land/std@0.203.0/fmt/colors.ts";

const versionUpSchema = z.enum(["major", "minor", "patch"]);
type VersionUp = z.infer<typeof versionUpSchema>;

const getOutput = async (cmd: Deno.Process): Promise<string> => {
  const { code } = await cmd.status();
  if (code !== 0) {
    throw new Error("command failed");
  }

  const rawOutput = await cmd.output();
  const output = new TextDecoder().decode(rawOutput);
  return output;
};

const getLatestTag = async () => {
  const p = Deno.run({
    cmd: ["git", "describe", "--abbrev=0", "--tags"],
    stdout: "piped",
  });

  const output = await getOutput(p);
  if (!output.startsWith("v")) {
    console.error(colors.red("[ERROR]"), "invalid tag:", output);
    Deno.exit(1);
  }
  return output.trim();
};

type Version = {
  major: number;
  minor: number;
  patch: number | undefined;
};
const stringifyVersion = (version: Version): string => {
  const { major, minor, patch } = version;
  const concat = [major, minor, patch].filter((v) => v !== undefined);
  return concat.join(".");
};

const parseVersion = (version: string): Version => {
  const [major, minor, patch] = version
    .split(".")
    .map((v) => Number(v))
    .map((v) => (isNaN(v) ? undefined : v));

  if (major === undefined || minor === undefined) {
    console.error(colors.red("[ERROR]"), "invalid version:", version);
    Deno.exit(1);
  }

  return { major, minor, patch };
};

const bumpVersion = (version: Version, versionUp: VersionUp): Version => {
  const { major, minor, patch } = version;

  switch (versionUp) {
    case "major":
      return { major: major + 1, minor: 0, patch };
    case "minor":
      return { major, minor: minor + 1, patch };
    case "patch": {
      if (patch === undefined) {
        console.error(colors.red("[ERROR]"), "invalid keyword `patch`");
        Deno.exit(1);
      }

      return { major, minor, patch: patch + 1 };
    }
  }
};

const checkDiff = async () => {
  const p = Deno.run({
    cmd: ["git", "diff", "--name-only", "HEAD", "--", ":(exclude)dist/*"],
    stdout: "piped",
  });

  const output = await getOutput(p);
  if (output.trim() === "") {
    return;
  }

  console.error(colors.red("[ERROR]"), "diff found:\n", output);
  Deno.exit(1);
};

const parseTag = (tag: string): Version => {
  if (!tag.startsWith("v")) {
    console.error(colors.red("[ERROR]"), "invalid tag:", tag);
    Deno.exit(1);
  }

  return parseVersion(tag.slice(1));
};
const stringifyTag = (version: Version): string => {
  return "v" + stringifyVersion(version);
};

const runBundle = async () => {
  const p = Deno.run({
    cmd: ["npm", "run", "bundle"],
    stdout: "piped",
  });

  await getOutput(p);
};

const updatePackageJson = async (newVersion: Version) => {
  const content = await Deno.readTextFile("package.json");
  const json = JSON.parse(content);
  json.version = stringifyVersion(newVersion);
  await Deno.writeTextFile("package.json", JSON.stringify(json, null, 2));
};
const updateReadme = async (newVersion: Version) => {
  // like SSlime-s/traq-webhook@v1.2 format
  const content = await Deno.readTextFile("README.md");
  const regex = /SSlime-s\/traq-webhook@v\d+(?:\.\d+)+/g;

  const newContent = content.replace(
    regex,
    `SSlime-s/traq-webhook@${stringifyTag(newVersion)}`
  );
  await Deno.writeTextFile("README.md", newContent);
};

await checkDiff();

const args = Deno.args;

const latestTag = await getLatestTag();
const parsedLatestTag = parseTag(latestTag);

let versionUp: VersionUp;
if (args.length > 0) {
  const res = versionUpSchema.safeParse(args[0]);
  if (!res.success) {
    console.error(colors.red("[ERROR]"), res.error);
    Deno.exit(1);
  }

  versionUp = res.data;
} else {
  if (parsedLatestTag.patch !== undefined) {
    versionUp = "patch";
  } else {
    versionUp = "minor";
  }
}

const newVersion = bumpVersion(parsedLatestTag, versionUp);

console.log(
  colors.green("[INFO]"),
  "new version:",
  stringifyVersion(newVersion)
);

await runBundle();

await updatePackageJson(newVersion);
await updateReadme(newVersion);

{
  const p = Deno.run({
    cmd: ["git", "add", "README.md", "package.json", "dist"],
  });
  await p.status();
}

const newTag = stringifyTag(newVersion);

const commitMessage = `🎉 bump version (${newTag})`;

{
  const p = Deno.run({
    cmd: ["git", "commit", "-m", commitMessage],
  });
  await p.status();
}

{
  const p = Deno.run({
    cmd: ["git", "tag", newTag],
  });
  await p.status();
}

// {
//   const p = Deno.run({
//     cmd: ["git", "push"],
//   });
//   await p.status();
// }

// {
//   const p = Deno.run({
//     cmd: ["git", "push", "--tags"],
//   });
//   await p.status();
// }
