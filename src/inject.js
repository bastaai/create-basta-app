import fs from "fs";
import path from "path";

/**
 * Find all placeholders and map over them with the replacement values
 *
 * @param {string} rootDirectory - directory to walk through
 * @param {string[]} files - A list of file paths relative to the root directory
 * @param {Record<string,string>} map - Key/value map for placeholders to replace with actual values
 */
export function replacePlaceholders(baseDir, files, map) {
  for (const relativeFilePath of files) {
    const filePath = path.join(baseDir, relativeFilePath);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ This file does not exist: ${relativeFilePath}`);
      continue;
    }

    let content = fs.readFileSync(filePath, "utf8");

    // Loop through keys and replace manually
    for (const [key, value] of Object.entries(map)) {
      const pattern = new RegExp(key, "g");
      content = content.replace(pattern, value);
    }

    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✔ Processed: ${relativeFilePath}`);
  }
}