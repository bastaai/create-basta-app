/**
 * Just an output for next steps
 *
 * @param {string} projectDirectory
 */
export function finalInstructions(projectDirectory) {
  const projectName = projectDirectory.split("/").reverse()[0];
  // 4. Finish
  console.log(`\n🎉 Project '${projectName}' created `);
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  pnpm dev`);
}
