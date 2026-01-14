# ScanPack

Dependency scanner to detect unknown or malicious packages in Node.js and Bun projects.

## Features

- Validates all dependencies in `package.json`
- Checks if packages exist on npm registry
- Detects known malicious packages
- Automatically detects npm security holding packages (removed packages)
- npm audit integration - Checks for known vulnerabilities (CVEs)
- Transitive dependencies - Scans dependencies from lock files
- Generates detailed dependency report
- Supports Node.js and Bun projects
- Dynamic batch processing for optimal performance
- Progress bar for visual feedback
- Ignore specific packages (`.scanpackignore` or `--ignore`)
- Rate limiting protection with caching
- CI/CD mode for clean pipeline output
- Auto-remove dangerous dependencies (`-rd` / `--remove-dangerous`)
- GitHub Actions integration
- Check for outdated packages

## Installation

```bash
npm install -g scanpack
# or
bun add -g scanpack
```

## Usage

### Command Line Interface

```bash
# Scan current project
scanpack

# Scan a specific project
scanpack /path/to/project

# JSON output
scanpack --json

# Verbose mode (more details)
scanpack --verbose

# CI/CD mode (minimal output, no colors)
scanpack --ci

# Ignore specific packages
scanpack --ignore "internal-pkg,legacy-lib"

# Rate limiting (requests per second)
scanpack --rate-limit 5

# Remove dangerous dependencies automatically
scanpack -rd
# or
scanpack --remove-dangerous

# By default, scanpack includes:
# - npm audit vulnerability check (use --no-audit to disable)
# - outdated packages check (use --no-outdated to disable)

# Include transitive dependencies from lock files
scanpack --transitive

# Disable audit check (faster, but less secure)
scanpack --no-audit

# Disable outdated check
scanpack --no-outdated

# Combine multiple options
scanpack --transitive --no-outdated

# Show help
scanpack --help
```

### Ignoring Packages

You can ignore packages in two ways:

1. **Command line flag:**
   ```bash
   scanpack --ignore "package1,package2"
   ```

2. **`.scanpackignore` file** (in project root):
   ```
   # Comments start with #
   internal-package
   @company/private-lib
   legacy-lib
   ```

### Programmatic Usage

```typescript
import { PackageReader, DependencyValidator } from 'scanpack';

// Read dependencies
const dependencies = PackageReader.readDependencies('./my-project');

// Scan dependencies
const report = await DependencyValidator.validateDependencies(dependencies);

console.log(report);
```

## Example Output

```
Scanning dependencies...

Found 25 dependencies

Validation Summary:

  Total: 25
  Valid: 23
  Invalid: 2
  Malicious: 1
  Unknown: 1

Problematic Dependencies:

  xdater@6.2.0
    Type: devDependency
    Package banned from npm for containing malicious scripts

  malicious-package@1.0.0
    Type: dependency
    Security holding package - original package was removed by npm for security reasons

  unknown-package@1.0.0
    Type: dependency
    Package not found on npm

Security Audit Summary:

  Total vulnerabilities: 3
  Critical: 1
  High: 1
  Moderate: 1

Problematic Dependencies:

  vulnerable-package@1.0.0
    Type: dependency
    CRITICAL: Remote Code Execution vulnerability
       Patched in: >=2.0.0
```

## Exit Codes

- `0`: All dependencies are valid
- `1`: Found malicious dependencies
- `2`: Found unknown dependencies (but not malicious)
- `3`: Found critical/high vulnerabilities (npm audit is enabled by default)

## Options

| Option | Description |
|--------|-------------|
| `-v, --verbose` | Show detailed information and debug logs |
| `-j, --json` | Output results in JSON format |
| `-c, --ci` | CI/CD mode: minimal output, no colors, no progress bar |
| `-i, --ignore <packages>` | Comma-separated list of packages to ignore |
| `-r, --rate-limit <number>` | Maximum requests per second to npm registry (default: 10) |
| `-rd, --remove-dangerous` | Automatically remove dangerous dependencies from package.json |
| `-a, --audit` | Enable npm audit vulnerability check (enabled by default) |
| `--no-audit` | Disable npm audit vulnerability check |
| `-t, --transitive` | Include transitive dependencies from lock files |
| `-o, --outdated` | Check for outdated packages (enabled by default) |
| `--no-outdated` | Disable outdated packages check |
| `-h, --help` | Display help information |

## Security Features

### Malicious Packages Detection

The scanner uses multiple methods to detect malicious packages:

1. **Known malicious packages list**: Maintains a curated list of known malicious packages in `src/malicious-packages.json`
2. **Suspicious patterns**: Detects packages matching suspicious naming patterns (regex-based)
3. **Security holding packages**: Automatically detects npm security holding packages (packages removed by npm for security reasons, marked as `0.0.1-security`)

You can add new packages to the known malicious list by editing `src/malicious-packages.json`. See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

### Vulnerability Detection (npm audit)

**Enabled by default!** ScanPack automatically integrates with npm's audit system to check for known vulnerabilities (CVEs) in your dependencies. This complements the malicious package detection by identifying security issues in legitimate packages.

You can disable it with `--no-audit` if needed (e.g., for faster scans or when npm audit is not available).

The audit check:
- Runs `npm audit` internally
- Reports vulnerabilities by severity (critical, high, moderate, low, info)
- Shows which packages are affected
- Indicates if patches are available

### Transitive Dependencies

The `--transitive` flag enables scanning of all dependencies, including indirect ones from lock files:
- Reads `package-lock.json` (npm)
- Reads `yarn.lock` (Yarn)
- Reads `pnpm-lock.yaml` (pnpm)

This provides comprehensive coverage of your entire dependency tree.

### Outdated Packages

**Enabled by default!** ScanPack automatically checks if your installed packages have newer versions available, helping you keep dependencies up to date. You can disable it with `--no-outdated` if needed.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm run dev

# Build
pnpm run build

# Test CLI locally
pnpm run cli

# Run tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

## Contributing

Contributions are welcome! Feel free to:

- Add new malicious packages to the list
- Improve detection of suspicious patterns
- Add new features

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT

## Links

- [GitHub Repository](https://github.com/nuelst/scanpack)
