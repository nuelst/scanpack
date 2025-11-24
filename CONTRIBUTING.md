# Contributing to the Malicious Packages List

## How to Add a Malicious Package

To add a new package to the known malicious list, edit the `src/malicious-packages.json` file.

### File Structure

```json
{
  "packages": [
    {
      "name": "package-name",
      "reason": "Reason why the package is malicious",
      "severity": "high|medium|low"
    }
  ],
  "patterns": [
    {
      "pattern": ".*-malware",
      "reason": "Description of the suspicious pattern",
      "severity": "high|medium|low"
    }
  ]
}
```

### Example

```json
{
  "packages": [
    {
      "name": "xdater",
      "reason": "Package banned from npm for containing malicious scripts",
      "severity": "high"
    },
    {
      "name": "another-malicious-package",
      "reason": "Package that steals credentials",
      "severity": "high"
    }
  ],
  "patterns": [
    {
      "pattern": ".*-malware",
      "reason": "Suspicious pattern for malicious packages",
      "severity": "high"
    }
  ]
}
```

### Severity Levels

- **high**: Extremely dangerous package, should be removed immediately
- **medium**: Suspicious package, requires investigation
- **low**: Package with questionable behavior

### Patterns

Patterns use regular expressions (regex) to detect suspicious package names. Examples:

- `.*-malware`: Detects any package ending with "-malware"
- `virus-.*`: Detects any package starting with "virus-"
- `.*-trojan.*`: Detects packages containing "-trojan-"

## Reliable Sources

When adding malicious packages, make sure you have evidence from reliable sources:

- Official npm announcements
- Security reports
- Recognized security communities
- Verified code analysis

## Testing

After adding a new package, test with:

```bash
npm run cli -- /path/to/project-with-malicious-package
```
