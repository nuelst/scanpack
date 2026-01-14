import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { AuditSummary, Vulnerability } from '../../domain/entities.js';
import type { NpmAuditPort } from '../../domain/ports.js';

const execAsync = promisify(exec);

interface NpmAuditResponse {
  vulnerabilities?: Record<string, {
    name: string;
    severity: string;
    title: string;
    patchedVersions?: string;
    url?: string;
  }>;
  metadata?: {
    vulnerabilities?: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
      info: number;
    };
  };
}

export class NpmAuditAdapter implements NpmAuditPort {
  async runAudit(projectPath: string): Promise<{
    vulnerabilities: Vulnerability[];
    summary: AuditSummary;
  }> {
    try {
      // Run npm audit --json
      const { stdout, stderr } = await execAsync('npm audit --json', {
        cwd: projectPath,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 60000 // 60 seconds timeout
      });

      if (stderr && !stderr.includes('npm WARN')) {
        // npm audit can output warnings to stderr, but we only care about actual errors
        const errorMatch = stderr.match(/npm ERR!/);
        if (errorMatch) {
          throw new Error(`npm audit failed: ${stderr}`);
        }
      }

      const auditData = JSON.parse(stdout) as NpmAuditResponse;

      // If no vulnerabilities, return empty result
      if (!auditData.vulnerabilities || Object.keys(auditData.vulnerabilities).length === 0) {
        return {
          vulnerabilities: [],
          summary: {
            total: 0,
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
            info: 0
          }
        };
      }

      // Convert npm audit format to our format
      const vulnerabilities: Vulnerability[] = [];
      const severityCount: AuditSummary = {
        total: 0,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0
      };

      for (const [vulnId, vuln] of Object.entries(auditData.vulnerabilities)) {
        const severity = this.normalizeSeverity(vuln.severity);

        vulnerabilities.push({
          id: vulnId,
          title: vuln.title || vuln.name,
          severity,
          package: vuln.name,
          patchedVersions: vuln.patchedVersions,
          url: vuln.url
        });

        severityCount.total++;
        severityCount[severity]++;
      }

      // Use metadata if available, otherwise use our calculated counts
      const summary = auditData.metadata?.vulnerabilities || severityCount;

      return {
        vulnerabilities,
        summary: {
          total: summary.total || severityCount.total,
          critical: summary.critical || severityCount.critical,
          high: summary.high || severityCount.high,
          moderate: summary.moderate || severityCount.moderate,
          low: summary.low || severityCount.low,
          info: summary.info || severityCount.info
        }
      };
    } catch (error) {
      // If npm audit fails (e.g., no package.json, no node_modules), return empty result
      if (error instanceof Error && (
        error.message.includes('ENOENT') ||
        error.message.includes('No package.json') ||
        error.message.includes('npm ERR!')
      )) {
        return {
          vulnerabilities: [],
          summary: {
            total: 0,
            critical: 0,
            high: 0,
            moderate: 0,
            low: 0,
            info: 0
          }
        };
      }
      throw error;
    }
  }

  private normalizeSeverity(severity: string): 'critical' | 'high' | 'moderate' | 'low' | 'info' {
    const normalized = severity.toLowerCase();
    if (normalized === 'critical' || normalized === 'high' || normalized === 'moderate' || normalized === 'low' || normalized === 'info') {
      return normalized;
    }
    // Default mapping
    if (normalized.includes('critical') || normalized.includes('severe')) return 'critical';
    if (normalized.includes('high')) return 'high';
    if (normalized.includes('moderate') || normalized.includes('medium')) return 'moderate';
    if (normalized.includes('low')) return 'low';
    return 'info';
  }
}

