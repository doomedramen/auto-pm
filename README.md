# @doomedramen/auto (Auto-PM)

`@doomedramen/auto` (formerly Auto-PM) is a CLI tool that automatically detects the package manager (npm, yarn, pnpm, bun, deno) in your project and runs commands accordingly. This allows you to use a consistent command (`auto`) across different projects without worrying about which package manager is in use.

## Features

- Automatically detects npm, yarn, pnpm, bun, and deno.
- Seamlessly runs package manager commands.
- Supports executing packages with `auto x <package>` (equivalent to `npx`, `yarn dlx`, `pnpm dlx`, `bun x`, `deno run -A`).

## Installation

### Global Installation (Recommended)

Install `@doomedramen/auto` globally to use the `auto` command in any project:

```bash
npm install -g @doomedramen/auto
```

### Local Installation

You can also install `@doomedramen/auto` as a dev dependency in a specific project:

```bash
npm install --save-dev @doomedramen/auto
```

Then you can run it via `npx auto ...` or by adding it to your `package.json` scripts.

## Usage

Once installed globally, you can use the `auto` command in any project directory that uses a supported package manager.

### Basic Commands

- `auto install`: Installs project dependencies (e.g., runs `npm install`, `yarn install`, etc.).
- `auto add <package>`: Adds a new package (e.g., runs `npm install <package>`, `yarn add <package>`, etc.).
- `auto remove <package>`: Removes a package (e.g., runs `npm uninstall <package>`, `yarn remove <package>`, etc.).
- `auto run <script>`: Runs a script defined in your `package.json` (e.g., runs `npm run <script>`, `yarn <script>`, etc.).

### Executing Packages (like npx)

The `auto x` command allows you to execute packages without installing them globally, similar to `npx`, `yarn dlx`, `pnpm dlx`, `bun x`, or `deno run -A`.

```bash
auto x create-react-app my-app
auto x cowsay "Hello World"
```

### Passing Arguments

Arguments are passed through to the underlying package manager command:

```bash
auto add typescript --dev
auto run build --watch
```

## How it Works

`@doomedramen/auto` detects the package manager by looking for specific lock files or configuration files in the current directory and its parent directories:

- `yarn.lock` for Yarn
- `package-lock.json` for npm
- `pnpm-lock.yaml` for pnpm
- `bun.lockb` or `bun.lock` for Bun
- `deno.json` or `deno.jsonc` for Deno

If no lock file is found, it will throw an error.

## Supported Package Managers

- npm
- Yarn
- pnpm
- Bun
- Deno

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have suggestions or find a bug.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
