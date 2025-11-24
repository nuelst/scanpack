import chalk from 'chalk';
import { Command } from 'commander';
import { PackageReader } from './package-reader.js';
import { DependencyValidator } from './validator.js';

const program = new Command();

program
  .name('scanpack')
  .description('Dependency scanner to detect unknown or malicious packages')
  .version('1.0.0')
  .argument('[path]', 'Project path (default: current directory)', process.cwd())
  .option('-v, --verbose', 'Show detailed information')
  .option('-j, --json', 'Output in JSON format')
  .action(async (path: string, options) => {
    try {
      console.log(chalk.blue('🔍 Scanning dependencies...\n'));

      const dependencies = PackageReader.readDependencies(path);
      console.log(chalk.gray(`📦 Found ${dependencies.length} dependencies\n`));

      const report = await DependencyValidator.validateDependencies(dependencies);

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log(chalk.bold('\n📊 Validation Summary:\n'));
      console.log(`  Total: ${chalk.cyan(report.totalDependencies)}`);
      console.log(`  ${chalk.green('✓ Valid:')} ${chalk.green(report.validDependencies)}`);
      console.log(`  ${chalk.red('✗ Invalid:')} ${chalk.red(report.invalidDependencies)}`);
      console.log(`  ${chalk.red('⚠ Malicious:')} ${chalk.red(report.maliciousDependencies)}`);
      console.log(`  ${chalk.yellow('? Unknown:')} ${chalk.yellow(report.unknownDependencies)}`);

      const problematic = report.results.filter(r => !r.isValid);

      if (problematic.length > 0) {
        console.log(chalk.bold('\n⚠️  Problematic Dependencies:\n'));

        for (const result of problematic) {
          const { dependency, isKnownMalicious, reason, npmUrl } = result;

          if (isKnownMalicious) {
            console.log(chalk.red(`  ✗ ${dependency.name}@${dependency.version}`));
            console.log(chalk.red(`    Type: ${dependency.type}`));
            console.log(chalk.red(`    ⚠️  ${reason || 'Known malicious package'}`));
          } else {
            console.log(chalk.yellow(`  ? ${dependency.name}@${dependency.version}`));
            console.log(chalk.yellow(`    Type: ${dependency.type}`));
            console.log(chalk.yellow(`    ⚠️  ${reason || 'Package not found on npm'}`));
          }

          if (options.verbose && npmUrl) {
            console.log(chalk.gray(`    URL: ${npmUrl}`));
          }

          console.log();
        }
      } else {
        console.log(chalk.green('\n✅ All dependencies are valid!\n'));
      }

      if (report.maliciousDependencies > 0) {
        process.exit(1);
      } else if (report.unknownDependencies > 0) {
        process.exit(2);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();

