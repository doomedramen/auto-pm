import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

function detectPackageManager(): {
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
    }

    const parentDir = join(currentDir, "..");
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  throw new Error("No supported package manager detected.");
}

function runCommand(command: string, subcommand: string, args: string[]) {
  const cmdArgs = subcommand ? [subcommand, ...args] : args;
  const fullCommand = `${command} ${cmdArgs.join(" ")}`;

  try {
    execSync(fullCommand, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error: ${error}`);
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
    } else {
      console.error(
        `Error: 'x' command is not supported for package manager '${packageManager}'`
      );
      process.exit(1);
    }
  } else {
    const packageJsonPath = join(projectRoot, "package.json");
    const scripts = existsSync(packageJsonPath)
      ? JSON.parse(readFileSync(packageJsonPath, "utf-8")).scripts || {}
      : {};

    if (scripts[command]) {
      runCommand(packageManager, "run", [command, ...args]);
    } else {
      runCommand(packageManager, command, args);
    }
  }
}

main();
