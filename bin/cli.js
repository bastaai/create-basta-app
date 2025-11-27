#!/usr/bin/env node
import prompts from "prompts";
import { program } from "commander";
import { createProject } from "../src/scaffold.js";
import { replacePlaceholders } from "../src/inject.js";
import { finalInstructions } from "../src/instructions.js";

const templateChoices = [
  { title: "NextJS", value: "nextjs" },
  { title: "Vite", value: "vite" },
];

program
  .option("-t, --template <name>", "Choose a template")
  .option("-n, --name <name>", "Name for project")
  .parse(process.argv);

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

let template = options.template;
if (!template || !Object.values(templateChoices).includes(template)) {
  const response = await prompts({
    type: "select",
    name: "template",
    message: "Pick a project template",
    choices: templateChoices,
  });
  template = response.template;
}

const projectDir = createProject({ template, name });
replacePlaceholders(projectDir, ["package.json"], {
  __APP_NAME__: name,
});
finalInstructions(projectDir);
