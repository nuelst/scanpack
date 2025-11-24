# 🔒 ScanPack

Dependency scanner to detect unknown or malicious packages in Node.js and Bun projects.

## 🎯 Features

- ✅ Validates all dependencies in `package.json`
- 🔍 Checks if packages exist on npm
- ⚠️ Detects known malicious packages
- 📊 Generates detailed dependency report
- 🚀 Supports Node.js and Bun projects

## 📦 Installation

```bash
npm install -g scanpack
# or
bun add -g scanpack
```

## 🚀 Usage

### As CLI

```bash
# Scan current project
scanpack

# Scan a specific project
scanpack /path/to/project

# JSON output
scanpack --json

# Verbose mode (more details)
scanpack --verbose
```

### As Module

```typescript
import { PackageReader, DependencyValidator } from 'scanpack';

// Read dependencies
const dependencies = PackageReader.readDependencies('./my-project');

// Scan dependencies
const report = await DependencyValidator.validateDependencies(dependencies);

console.log(report);
```

## 📊 Example Output

```
🔍 Scanning dependencies...

📦 Found 25 dependencies

📊 Validation Summary:

  Total: 25
  ✓ Valid: 23
  ✗ Invalid: 2
  ⚠ Malicious: 1
  ? Unknown: 1

⚠️  Problematic Dependencies:

  ✗ xdater@6.2.0
    Type: devDependency
    ⚠️  Package banned from npm for containing malicious scripts

  ? unknown-package@1.0.0
    Type: dependency
    ⚠️  Package not found on npm
```

## 🔧 Exit Codes

- `0`: All dependencies are valid
- `1`: Found malicious dependencies
- `2`: Found unknown dependencies (but not malicious)

## 🛡️ Malicious Packages List

The scanner maintains a list of known malicious packages. You can add new packages by editing `src/malicious-packages.json`.

## 📝 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Test CLI locally
npm run cli
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Add new malicious packages to the list
- Improve detection of suspicious patterns
- Add new features

## 📄 License

MIT

## 🔗 Links

- [GitHub Repository](https://github.com/nuelst/scanpack)
