#!/usr/bin/env node

import chalk from 'chalk';
import cliProgress from 'cli-progress';
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ScanPackError } from '../domain/errors.js';
import { FileSystemAdapter } from '../infrastructure/adapters/file-system.adapter.js';
import { IgnoreListAdapter } from '../infrastructure/adapters/ignore-list.adapter.js';
import { createValidateDependenciesUseCase, logger, readDependenciesUseCase } from '../infrastructure/container.js';

const program = new Command();

program
  .name('scanpack')
  .description('Dependency scanner to detect unknown or malicious packages in Node.js and Bun projects')
  .version('1.1.2')
  .argument('[path]', 'Project path (default: current directory)', process.cwd())
  .option('-v, --verbose', 'Show detailed information and debug logs')
  .option('-j, --json', 'Output in JSON format')
  .option('-c, --ci', 'CI/CD mode: minimal output, no colors, no progress bar')
  .option('-i, --ignore <packages>', 'Comma-separated list of packages to ignore')
  .option('-r, --rate-limit <number>', 'Maximum requests per second to npm registry', '10')
  .option('-rd, --remove-dangerous', 'Automatically remove dangerous dependencies from package.json')
  .option('-a, --audit', 'Enable npm audit vulnerability check', true)
  .option('--no-audit', 'Disable npm audit vulnerability check')
  .option('-t, --transitive', 'Include transitive dependencies from lock files')
  .option('-o, --outdated', 'Check for outdated packages', true)
  .option('--no-outdated', 'Disable outdated packages check')
  .addHelpText('after', `
Examples:
  $ scanpack
  $ scanpack ./my-project
  $ scanpack --json > report.json
  $ scanpack --ci --rate-limit 5
  $ scanpack --ignore "internal-pkg,legacy-lib"
  $ scanpack -rd
  $ scanpack --remove-dangerous

Exit Codes:
  0  All dependencies are valid
  1  Found malicious dependencies
  2  Found unknown dependencies (but not malicious)
  3  Found critical/high vulnerabilities (when using --audit)

For more information, visit: https://github.com/nuelst/scanpack
  `)
  .action(async (path: string, options) => {
    try {
      const isCI = options.ci || process.env.CI === 'true';
      const rateLimit = Number.parseInt(options.rateLimit || '10', 10);
      const ignoreList: string[] = [];

      // Load ignore list from file and CLI
      const fileSystem = new FileSystemAdapter();
      const ignoreListAdapter = new IgnoreListAdapter(fileSystem, path);
      ignoreList.push(...ignoreListAdapter.getIgnoreList());

      if (options.ignore) {
        ignoreList.push(...options.ignore.split(',').map((p: string) => p.trim()));
      }

      logger.debug('Starting dependency scan', { path, options, ignoreList, rateLimit });

      if (!isCI) {
        console.log(chalk.blue('🔍 Scanning dependencies...\n'));
      }

      const dependencies = await readDependenciesUseCase.execute(path);
      logger.info('Dependencies read', { count: dependencies.length });

      if (!isCI) {
        console.log(chalk.gray(`📦 Found ${dependencies.length} dependencies\n`));
      }

      // Create progress bar if not in CI mode
      let progressBar: cliProgress.SingleBar | null = null;
      if (!isCI && !options.json) {
        progressBar = new cliProgress.SingleBar({
          format: 'Progress |{bar}| {percentage}% | {value}/{total} dependencies',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        });
        progressBar.start(dependencies.length, 0);
      }

      // Create use case with rate limiting and optional features
      // By default, enable audit and outdated checks for better security
      // Transitive dependencies are optional as they can be slow
      const includeAudit = options.audit !== false; // Default: true (Commander sets to false only if --no-audit)
      const includeTransitive = options.transitive || false; // Default: false (can be slow)
      const checkOutdated = options.outdated !== false; // Default: true (Commander sets to false only if --no-outdated)

      const validateDependenciesUseCase = createValidateDependenciesUseCase(
        rateLimit,
        includeAudit,
        includeTransitive
      );

      const report = await validateDependenciesUseCase.execute(dependencies, {
        ignore: ignoreList,
        rateLimit,
        includeAudit,
        includeTransitive,
        checkOutdated,
        onProgress: (current, total) => {
          if (progressBar) {
            progressBar.update(current);
          }
        }
      }, path);

      if (progressBar) {
        progressBar.stop();
      }

      logger.info('Validation complete', {
        total: report.totalDependencies,
        valid: report.validDependencies,
        invalid: report.invalidDependencies,
        malicious: report.maliciousDependencies
      });

      // Handle remove dangerous flag
      if (options.removeDangerous) {
        const dangerousDeps = report.results.filter(
          r => r.isKnownMalicious || r.isSecurityHolding
        );

        if (dangerousDeps.length > 0) {
          const packageJsonPath = join(path, 'package.json');
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

          for (const result of dangerousDeps) {
            const { dependency } = result;
            let depType: string;
            if (dependency.type === 'devDependency') {
              depType = 'devDependencies';
            } else if (dependency.type === 'peerDependency') {
              depType = 'peerDependencies';
            } else if (dependency.type === 'optionalDependency') {
              depType = 'optionalDependencies';
            } else {
              depType = 'dependencies';
            }

            const deps = packageJson[depType as keyof typeof packageJson] as Record<string, string> | undefined;
            if (deps?.[dependency.name]) {
              delete deps[dependency.name];
              logger.info('Removed dangerous dependency', {
                name: dependency.name,
                type: dependency.type
              });
            }
          }

          writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

          if (!isCI) {
            console.log(chalk.green(`\n✅ Removed ${dangerousDeps.length} dangerous dependencies from package.json\n`));
          }
        }
      }

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      if (isCI) {
        // Minimal output for CI
        if (report.maliciousDependencies > 0) {
          console.log(`Found ${report.maliciousDependencies} malicious dependencies`);
        }
        if (report.unknownDependencies > 0) {
          console.log(`Found ${report.unknownDependencies} unknown dependencies`);
        }
        return;
      }

      console.log(chalk.bold('\n📊 Validation Summary:\n'));
      console.log(`  Total: ${chalk.cyan(report.totalDependencies)}`);
      console.log(`  ${chalk.green('✓ Valid:')} ${chalk.green(report.validDependencies)}`);
      console.log(`  ${chalk.red('✗ Invalid:')} ${chalk.red(report.invalidDependencies)}`);
      console.log(`  ${chalk.red('⚠ Malicious:')} ${chalk.red(report.maliciousDependencies)}`);
      console.log(`  ${chalk.yellow('? Unknown:')} ${chalk.yellow(report.unknownDependencies)}`);

      // Show audit summary if available
      if (report.auditSummary) {
        const { auditSummary } = report;
        console.log(chalk.bold('\n🔒 Security Audit Summary:\n'));
        if (auditSummary.total > 0) {
          console.log(`  ${chalk.red('Total vulnerabilities:')} ${chalk.red(auditSummary.total)}`);
          if (auditSummary.critical > 0) {
            console.log(`  ${chalk.red('Critical:')} ${chalk.red(auditSummary.critical)}`);
          }
          if (auditSummary.high > 0) {
            console.log(`  ${chalk.red('High:')} ${chalk.red(auditSummary.high)}`);
          }
          if (auditSummary.moderate > 0) {
            console.log(`  ${chalk.yellow('Moderate:')} ${chalk.yellow(auditSummary.moderate)}`);
          }
          if (auditSummary.low > 0) {
            console.log(`  ${chalk.gray('Low:')} ${chalk.gray(auditSummary.low)}`);
          }
        } else {
          console.log(`  ${chalk.green('✓ No vulnerabilities found')}`);
        }
      }

      const problematic = report.results.filter(r => !r.isValid);

      if (problematic.length > 0) {
        console.log(chalk.bold('\n⚠️  Problematic Dependencies:\n'));

        for (const result of problematic) {
          const { dependency, isKnownMalicious, isSecurityHolding, reason, npmUrl, vulnerabilities, isOutdated, latestVersion } = result;

          if (isKnownMalicious || isSecurityHolding) {
            console.log(chalk.red(`  ✗ ${dependency.name}@${dependency.version}`));
            console.log(chalk.red(`    Type: ${dependency.type}`));
            if (isSecurityHolding) {
              console.log(chalk.red(`    ⚠️  ${reason || 'Security holding package'}`));
            } else {
              console.log(chalk.red(`    ⚠️  ${reason || 'Known malicious package'}`));
            }
          } else {
            console.log(chalk.yellow(`  ? ${dependency.name}@${dependency.version}`));
            console.log(chalk.yellow(`    Type: ${dependency.type}`));
            console.log(chalk.yellow(`    ⚠️  ${reason || 'Package not found on npm'}`));
          }

          // Show vulnerabilities if any
          if (vulnerabilities && vulnerabilities.length > 0) {
            for (const vuln of vulnerabilities) {
              const severityColor = vuln.severity === 'critical' || vuln.severity === 'high'
                ? chalk.red
                : vuln.severity === 'moderate'
                  ? chalk.yellow
                  : chalk.gray;
              console.log(severityColor(`    🔒 ${vuln.severity.toUpperCase()}: ${vuln.title}`));
              if (vuln.patchedVersions) {
                console.log(chalk.gray(`       Patched in: ${vuln.patchedVersions}`));
              }
            }
          }

          // Show outdated info
          if (isOutdated && latestVersion) {
            console.log(chalk.yellow(`    📦 Outdated: latest is ${latestVersion}`));
          }

          if (options.verbose && npmUrl) {
            console.log(chalk.gray(`    URL: ${npmUrl}`));
          }

          console.log();
        }
      } else {
        console.log(chalk.green('\n✅ All dependencies are valid!\n'));
      }

      // Exit codes: 0 = all good, 1 = malicious, 2 = unknown, 3 = vulnerabilities
      if (report.maliciousDependencies > 0) {
        process.exit(1);
      } else if (report.auditSummary && report.auditSummary.total > 0 && (report.auditSummary.critical > 0 || report.auditSummary.high > 0)) {
        process.exit(3);
      } else if (report.unknownDependencies > 0) {
        process.exit(2);
      }

    } catch (error) {
      if (error instanceof ScanPackError) {
        logger.error('ScanPack error', {
          code: error.code,
          message: error.message,
          cause: error.cause
        });
        console.error(chalk.red('❌ Error:'), error.message);
      } else {
        logger.error('Unexpected error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      }
      process.exit(1);
    }
  });

program.parse();
