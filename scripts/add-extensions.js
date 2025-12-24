const fs = require("fs");
const path = require("path");

function addExtensionsToImports(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addExtensionsToImports(filePath);
    } else if (file.endsWith(".js")) {
      let content = fs.readFileSync(filePath, "utf8");

      // Regex to match import/export statements with relative paths
      // Matches: import ... from './path' or export ... from './path'
      // Capture group 1: import/export ... from '
      // Capture group 2: the path
      // Capture group 3: '
      const importRegex =
        /(from\s+['"])(.[^'"]*)(['"])|(import\s+['"])(.[^'"]*)(['"])/g;

      content = content.replace(
        importRegex,
        (match, p1, p2, p3, p4, p5, p6) => {
          const prefix = p1 || p4;
          const importPath = p2 || p5;
          const quote = p3 || p6;

          if (importPath.startsWith(".") && !importPath.endsWith(".js")) {
            // check if we are importing a file or directory.
            // In this simple case, we assume if it doesn't have an extension, it likely needs .js
            // But wait, if it's a directory index, we need /index.js

            // However, since we are post-processing tsc output, tsc usually keeps the structure.
            // If source was: import ... from "./foo", and foo is foo.ts, dist has foo.js.
            // If source was: import ... from "./foo", and foo is folder/index.ts, dist has foo/index.js.

            // A safe bet for browser ESM is:
            // 1. If path points to a file that exists with .js appended, append .js
            // 2. If path points to a directory that has index.js, append /index.js (or just .js if it ends in /index already? No)

            // Let's resolve the path relative to the current file.
            const absoluteDir = path.dirname(filePath);
            const resolvedPath = path.resolve(absoluteDir, importPath);

            if (fs.existsSync(resolvedPath + ".js")) {
              return `${prefix}${importPath}.js${quote}`;
            }
            if (fs.existsSync(path.join(resolvedPath, "index.js"))) {
              return `${prefix}${importPath}/index.js${quote}`;
            }
          }
          return match;
        }
      );

      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in ${filePath}`);
    }
  }
}

const distDir = path.join(__dirname, "../dist");
if (fs.existsSync(distDir)) {
  console.log("Adding .js extensions to imports in dist...");
  addExtensionsToImports(distDir);
  console.log("Done.");
} else {
  console.error("dist directory not found. Run build first.");
  process.exit(1);
}
