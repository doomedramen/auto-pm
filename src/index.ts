import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

export function detectPackageManager(): {
  packageManager: string;
  projectRoot: string;
} {
  let currentDir = process.cwd();
  const maxDepth = 20;

  for (let depth = 0; depth < maxDepth; depth++) {
    if (existsSync(join(currentDir, "yarn.lock"))) {
      return { packageManager: "yarn", projectRoot: currentDir };
    } else if (existsSync(join(currentDir, "package-lock.json"))) {
      return { packageManager: "npm", projectRoot: currentDir };
    } else if (existsSync(join(currentDir, "pnpm-lock.yaml"))) {
      return { packageManager: "pnpm", projectRoot: currentDir };
    } else if (
      existsSync(join(currentDir, "bun.lockb")) ||
      existsSync(join(currentDir, "bun.lock"))
    ) {
      return { packageManager: "bun", projectRoot: currentDir };
    } else if (
      existsSync(join(currentDir, "deno.json")) ||
      existsSync(join(currentDir, "deno.jsonc"))
    ) {
      return { packageManager: "deno", projectRoot: currentDir };
    }

    const parentDir = join(currentDir, "..");
    if (parentDir === currentDir) {
      // Reached the root of the filesystem
      break;
    }
    currentDir = parentDir;
  }

  throw new Error(
    `No supported package manager detected. Searched up to: ${currentDir}`
  );
}

export function runCommand(
  command: string,
  subcommand: string,
  args: string[]
) {
  const cmdArgs = subcommand ? [subcommand, ...args] : args;
  const fullCommand = `${command} ${cmdArgs.join(" ")}`;
  console.log(`> ${fullCommand}`); // Log the command being run

  try {
    execSync(fullCommand, { stdio: "inherit" });
  } catch (error: any) {
    let errorMessage = `Error executing command: ${fullCommand}\n`;
    if (error.status) {
      errorMessage += `Command failed with exit code ${error.status}\n`;
    }
    if (error.message) {
      errorMessage += `Message: ${error.message}\n`;
    }
    if (error.stderr) {
      errorMessage += `Stderr: ${error.stderr.toString()}\n`;
    }
    console.error(errorMessage);
    process.exit(1);
  }
}

function main() {
  const start = Date.now();

  const [, , command, ...args] = process.argv;
  if (!command) {
    console.log("Usage: auto <command> [args...]");
    process.exit(1);
  }

  let packageManager: string;
  let projectRoot: string;

  try {
    ({ packageManager, projectRoot } = detectPackageManager());
  } catch (error) {
    console.error((error as any).message);
    process.exit(1);
  }

  const duration = Date.now() - start;
  console.log(
    `Package manager detected: ${packageManager} (took ${duration}ms)`
  );

  if (command === "x") {
    if (packageManager === "npm") {
      runCommand("npx", "", args);
    } else if (packageManager === "yarn") {
      runCommand("yarn", "dlx", args);
    } else if (packageManager === "pnpm") {
      runCommand("pnpm", "dlx", args);
    } else if (packageManager === "bun") {
      runCommand("bun", "x", args);
    } else if (packageManager === "deno") {
      // For Deno, 'x' equivalent is typically 'deno run -A'
      // The first arg in 'args' is the script/url, rest are its arguments
      if (args.length > 0) {
        runCommand("deno", "run", ["-A", ...args]);
      } else {
        console.error("Error: 'deno x' requires a script or URL to execute.");
        process.exit(1);
      }
    } else {
      console.error(
        `Error: 'x' command is not supported for package manager '${packageManager}'`
      );
      process.exit(1);
    }
  } else {
    const packageJsonPath = join(projectRoot, "package.json");
    let scripts: { [key: string]: string } = {}; // Define type for scripts object
    if (existsSync(packageJsonPath)) {
      try {
        const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageJsonContent);
        scripts = packageJson.scripts || {};
      } catch (parseError: any) {
        console.error(
          `Error parsing package.json at ${packageJsonPath}: ${parseError.message}`
        );
        // Optionally, exit or proceed without scripts
        // process.exit(1);
      }
    }

    if (scripts[command]) {
      runCommand(packageManager, "run", [command, ...args]);
    } else {
      runCommand(packageManager, command, args);
    }
  }
}

if (require.main === module) {
  main();
}
