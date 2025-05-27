import { detectPackageManager, runCommand } from "./index"; // Adjust path as necessary
import * as fs from "fs";
import * as child_process from "child_process";
// Do not import path directly here, it will be mocked.

// Mock fs and child_process modules
jest.mock("fs");
jest.mock("child_process");

// Mock the path module
jest.mock("path", () => {
  const originalPath = jest.requireActual("path"); // Get actual path module for non-mocked functions
  return {
    ...originalPath, // Spread original path module to keep other functions intact
    join: jest.fn((...args: string[]) => {
      if (args.length === 2 && args[1] === "..") {
        const base = args[0];
        if (base === "/" || base === "") return "/";
        const lastSlash = base.lastIndexOf("/");
        if (lastSlash === -1) return ".";
        if (lastSlash === 0) return "/";
        return base.substring(0, lastSlash);
      }
      return args.filter((arg) => arg !== "").join("/");
    }),
    dirname: jest.fn((p: string) => {
      if (p === "/" || p === "") return "/";
      const lastSlash = p.lastIndexOf("/");
      if (lastSlash === -1) return ".";
      if (lastSlash === 0) return "/";
      return p.substring(0, lastSlash);
    }),
  };
});

// Import the mocked path module *after* jest.mock
const path = require("path");

describe("detectPackageManager", () => {
  const mockExistsSync = fs.existsSync as jest.Mock;
  const mockCwd = jest.spyOn(process, "cwd");

  beforeEach(() => {
    mockExistsSync.mockReset();
    mockCwd.mockReset();
    (path.join as jest.Mock).mockClear();
    (path.dirname as jest.Mock).mockClear();

    (path.join as jest.Mock).mockImplementation((...args: string[]) => {
      if (args.length === 2 && args[1] === "..") {
        const base = args[0];
        if (base === "/" || base === "") return "/";
        const lastSlash = base.lastIndexOf("/");
        if (lastSlash === -1) return ".";
        if (lastSlash === 0) return "/";
        return base.substring(0, lastSlash);
      }
      return args.filter((arg) => arg !== "").join("/");
    });
    (path.dirname as jest.Mock).mockImplementation((p: string) => {
      if (p === "/" || p === "") return "/";
      const lastSlash = p.lastIndexOf("/");
      if (lastSlash === -1) return ".";
      if (lastSlash === 0) return "/";
      return p.substring(0, lastSlash);
    });
  });

  it("should detect yarn", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation(
      (filePath) => filePath === "/test-project/yarn.lock"
    );
    expect(detectPackageManager()).toEqual({
      packageManager: "yarn",
      projectRoot: "/test-project",
    });
  });

  it("should detect npm", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation(
      (filePath) => filePath === "/test-project/package-lock.json"
    );
    expect(detectPackageManager()).toEqual({
      packageManager: "npm",
      projectRoot: "/test-project",
    });
  });

  it("should detect pnpm", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation(
      (filePath) => filePath === "/test-project/pnpm-lock.yaml"
    );
    expect(detectPackageManager()).toEqual({
      packageManager: "pnpm",
      projectRoot: "/test-project",
    });
  });

  it("should detect bun", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation(
      (filePath) => filePath === "/test-project/bun.lockb"
    );
    expect(detectPackageManager()).toEqual({
      packageManager: "bun",
      projectRoot: "/test-project",
    });
  });

  it("should detect bun with bun.lock (alternative lock file name)", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation((filePath) => {
      if (filePath === "/test-project/bun.lockb") return false;
      return filePath === "/test-project/bun.lock";
    });
    expect(detectPackageManager()).toEqual({
      packageManager: "bun",
      projectRoot: "/test-project",
    });
  });

  it("should detect deno with deno.json", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation(
      (filePath) => filePath === "/test-project/deno.json"
    );
    expect(detectPackageManager()).toEqual({
      packageManager: "deno",
      projectRoot: "/test-project",
    });
  });

  it("should detect deno with deno.jsonc", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockImplementation((filePath) => {
      if (filePath === "/test-project/deno.json") return false;
      return filePath === "/test-project/deno.jsonc";
    });
    expect(detectPackageManager()).toEqual({
      packageManager: "deno",
      projectRoot: "/test-project",
    });
  });

  it("should throw error if no lock file is found", () => {
    mockCwd.mockReturnValue("/test-project");
    mockExistsSync.mockReturnValue(false);
    expect(() => detectPackageManager()).toThrow(
      "No supported package manager detected."
    );
  });

  it("should traverse up to find lock file", () => {
    mockCwd.mockReturnValue("/test-project/subdir/subsubdir");

    mockExistsSync.mockImplementation((filePath: string) => {
      return filePath === "/test-project/yarn.lock";
    });

    expect(detectPackageManager()).toEqual({
      packageManager: "yarn",
      projectRoot: "/test-project",
    });
  });

  it("should stop at root if no lock file found during traversal", () => {
    mockCwd.mockReturnValue("/a/b/c");
    mockExistsSync.mockReturnValue(false);

    expect(() => detectPackageManager()).toThrow(
      "No supported package manager detected. Searched up to: /"
    );
  });
});

describe("runCommand for auto x", () => {
  const mockExecSync = child_process.execSync as jest.Mock;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;

  beforeEach(() => {
    mockExecSync.mockReset();
    mockConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockProcessExit = jest
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  // Test cases for existing package managers (npm, yarn, pnpm, bun) for 'x' command
  it("should use npx for npm x", () => {
    runCommand("npx", "", ["some-package"]);
    expect(mockExecSync).toHaveBeenCalledWith("npx some-package", {
      stdio: "inherit",
    });
  });

  it("should use yarn dlx for yarn x", () => {
    runCommand("yarn", "dlx", ["some-package"]);
    expect(mockExecSync).toHaveBeenCalledWith("yarn dlx some-package", {
      stdio: "inherit",
    });
  });

  it("should use pnpm dlx for pnpm x", () => {
    runCommand("pnpm", "dlx", ["some-package"]);
    expect(mockExecSync).toHaveBeenCalledWith("pnpm dlx some-package", {
      stdio: "inherit",
    });
  });

  it("should use bun x for bun x", () => {
    runCommand("bun", "x", ["some-package"]);
    expect(mockExecSync).toHaveBeenCalledWith("bun x some-package", {
      stdio: "inherit",
    });
  });

  // Test cases for Deno 'x' command
  it("should use deno run -A for deno x with a script/url", () => {
    runCommand("deno", "run", [
      "-A",
      "https://deno.land/std/examples/welcome.ts",
    ]);
    expect(mockExecSync).toHaveBeenCalledWith(
      "deno run -A https://deno.land/std/examples/welcome.ts",
      { stdio: "inherit" }
    );
  });

  it("should use deno run -A for deno x with a local script and args", () => {
    runCommand("deno", "run", ["-A", "./script.ts", "--arg1", "value1"]);
    expect(mockExecSync).toHaveBeenCalledWith(
      "deno run -A ./script.ts --arg1 value1",
      { stdio: "inherit" }
    );
  });

  // Note: The actual error for 'deno x' with no args is handled in main() in index.ts,
  // so we don't test runCommand directly for that case here.
  // We would test main() or a wrapper if we wanted to cover that specific error message.
});

describe("runCommand", () => {
  const mockExecSync = child_process.execSync as jest.Mock;

  beforeEach(() => {
    mockExecSync.mockReset();
  });

  it("should execute command with subcommand and args", () => {
    runCommand("npm", "run", ["test", "--watch"]);
    expect(mockExecSync).toHaveBeenCalledWith("npm run test --watch", {
      stdio: "inherit",
    });
  });

  it("should execute command with args only", () => {
    runCommand("npm", "install", ["jest"]);
    expect(mockExecSync).toHaveBeenCalledWith("npm install jest", {
      stdio: "inherit",
    });
  });

  it("should handle errors during command execution", () => {
    const mockConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const mockProcessExit = jest
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    mockExecSync.mockImplementation(() => {
      const err = new Error("Command failed") as any;
      err.status = 1;
      err.stderr = Buffer.from("Error output");
      throw err;
    });

    runCommand("npm", "run", ["fail"]);

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Error executing command: npm run fail")
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Command failed with exit code 1")
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Message: Command failed")
    );
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Stderr: Error output")
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);

    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });
});
