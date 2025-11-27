import fs from "fs";
import path from "path";

export function createProject({ template, name }) {
  const cwd = process.cwd();
  const projectDir = path.join(cwd, name);

  const templateDir = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../templates",
    template
  );

  // 1. Create the project directory
  fs.mkdirSync(projectDir);

  // 2. Copy template
  fs.cpSync(templateDir, projectDir, { recursive: true });

  console.log(`\n✅ Created project in ${projectDir}`);
  return projectDir;
}
