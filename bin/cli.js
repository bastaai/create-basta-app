#!/usr/bin/env node
import prompts from "prompts";
import { program } from "commander";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import { createProject } from "../src/scaffold.js";
import { replacePlaceholders } from "../src/inject.js";
import { finalInstructions } from "../src/instructions.js";

const templateChoices = [{ title: "NextJS - Online Only Auction House", value: "nextjs-online-only" }];

// Check if pnpm is installed
function checkPnpmInstalled() {
  try {
    execSync("pnpm --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if git is installed
function checkGitInstalled() {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize git repository and create initial commit
function initializeGit(projectDir) {
  console.log("\n🔧 Initializing git repository...");
  try {
    execSync("git init", {
      cwd: projectDir,
      stdio: "ignore",
    });
    execSync("git add .", {
      cwd: projectDir,
      stdio: "ignore",
    });
    execSync('git commit -m "Initial commit"', {
      cwd: projectDir,
      stdio: "ignore",
    });
    console.log("✅ Git repository initialized with initial commit");
    return true;
  } catch (error) {
    console.error("\n⚠️  Failed to initialize git repository");
    return false;
  }
}

// Run pnpm install in the project directory
function installDependencies(projectDir) {
  console.log("\n📦 Installing dependencies...");
  try {
    execSync("pnpm install", {
      cwd: projectDir,
      stdio: "inherit",
    });
    console.log("\n✅ Dependencies installed successfully");
    return true;
  } catch (error) {
    console.error("\n❌ Failed to install dependencies");
    return false;
  }
}

program.option("-n, --name <name>", "Name for project").parse(process.argv);

// Verify pnpm is installed before proceeding
if (!checkPnpmInstalled()) {
  console.error("\n❌ Error: pnpm is not installed.");
  console.error("Please install pnpm first:");
  console.error("  npm install -g pnpm");
  console.error("  or visit: https://pnpm.io/installation");
  process.exit(1);
}

const options = program.opts();

let name = options.name;
if (!name) {
  const response = await prompts({
    type: "text",
    name: "name",
    message: "Choose a project name",
  });
  name = response.name === "" ? "create-basta-app" : response.name;
}

// Ask user to select a template
const templateResponse = await prompts({
  type: "select",
  name: "template",
  message: "Pick a project template",
  choices: templateChoices,
});
const template = templateResponse.template;

const projectDir = createProject({ template, name });
replacePlaceholders(projectDir, ["package.json"], {
  __APP_NAME__: name,
});

// Ask if user wants to create .env.local file (only for NextJS templates)
if (template === "nextjs-online-only" || template.startsWith("nextjs")) {
  const envResponse = await prompts({
    type: "confirm",
    name: "createEnv",
    message: "Would you like to create a .env.local file for NextJS?",
    initial: true,
  });

  if (envResponse.createEnv) {
    const envVars = await prompts([
      {
        type: "text",
        name: "accountId",
        message: "Enter your Account ID:",
        validate: (value) => (value.trim() === "" ? "Account ID is required" : true),
      },
      {
        type: "password",
        name: "apiKey",
        message: "Enter your API Key:",
        validate: (value) => (value.trim() === "" ? "API Key is required" : true),
      },
    ]);

    if (envVars.accountId && envVars.apiKey) {
      // Generate a random secret for next-auth
      const nextAuthSecret = crypto.randomBytes(32).toString("base64");
      const envContent = `ACCOUNT_ID=${envVars.accountId}
API_KEY=${envVars.apiKey}
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${nextAuthSecret}
`;
      const envPath = path.join(projectDir, ".env.local");
      fs.writeFileSync(envPath, envContent, "utf8");
      console.log(`\n✅ Created .env.local file`);
    }
  }
}

// Install dependencies
installDependencies(projectDir);

// Initialize git repository if git is installed
if (checkGitInstalled()) {
  initializeGit(projectDir);
} else {
  console.log("\n⚠️  Git is not installed. Skipping git initialization.");
}

finalInstructions(projectDir);
