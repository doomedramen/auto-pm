# Auto-PM

Auto-PM is a CLI tool to detect the package manager in a project and run commands accordingly.

## Installation

```bash
npm install -g auto-pm
```

## Usage

```bash
auto <command> [args...]
```

- `x`: Runs a command using the appropriate package manager (e.g., `npx`, `yarn dlx`, etc.).
- Other commands are passed directly to the detected package manager.

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## License

This project is licensed under the MIT License.
