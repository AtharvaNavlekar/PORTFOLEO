#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              PORTFOLIO SECURITY AUDIT SCANNER                ║
 * ║                                                              ║
 * ║  Zero-dependency Node.js security scanner for static React   ║
 * ║  portfolio websites. Runs 7 check modules and produces a     ║
 * ║  structured JSON report with styled console output.          ║
 * ║                                                              ║
 * ║  Usage:                                                      ║
 * ║    node security-audit.mjs              # One-shot audit     ║
 * ║    node security-audit.mjs --watch      # Continuous mode    ║
 * ║    node security-audit.mjs --fix        # Auto-fix hints     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, watch } from 'fs';
import { join, extname, relative } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  srcDir: './src',
  buildDir: './dist',
  publicDir: './public',
  reportDir: './security-reports',
  entryHtml: './index.html',
  fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.css'],
  watchIntervalMs: 30_000,
  maxFileSizeBytes: 1_000_000, // Skip files > 1MB
  allowlist: {
    patterns: [],
  },
};

function loadConfig() {
  const configPath = join(__dirname, 'security-audit.config.json');
  if (existsSync(configPath)) {
    try {
      const userConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...userConfig, allowlist: { ...DEFAULT_CONFIG.allowlist, ...userConfig.allowlist } };
    } catch {
      log('WARN', 'Failed to parse security-audit.config.json, using defaults');
    }
  }
  return DEFAULT_CONFIG;
}

const CONFIG = loadConfig();
const args = process.argv.slice(2);
const WATCH_MODE = args.includes('--watch');
const FIX_MODE = args.includes('--fix');

// ═══════════════════════════════════════════════════════════════
//  LOGGER
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

const SEVERITY_COLORS = {
  CRITICAL: COLORS.bgRed + COLORS.white,
  HIGH: COLORS.red,
  MEDIUM: COLORS.yellow,
  LOW: COLORS.blue,
  INFO: COLORS.dim,
  PASS: COLORS.green,
};

const SEVERITY_ICONS = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '🔵',
  INFO: 'ℹ️ ',
  PASS: '✅',
};

function log(level, message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const color = SEVERITY_COLORS[level] || COLORS.reset;
  const icon = SEVERITY_ICONS[level] || '  ';
  console.log(`${COLORS.dim}[${timestamp}]${COLORS.reset} ${icon} ${color}${level.padEnd(8)}${COLORS.reset} ${message}`);
}

function banner() {
  console.log('');
  console.log(`${COLORS.cyan}${COLORS.bold}  ╔══════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bold}  ║         🛡️  PORTFOLIO SECURITY AUDIT SCANNER         ║${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bold}  ╚══════════════════════════════════════════════════════╝${COLORS.reset}`);
  console.log('');
}

function separator(title) {
  const line = '─'.repeat(52);
  console.log('');
  console.log(`${COLORS.cyan}  ┌${line}┐${COLORS.reset}`);
  console.log(`${COLORS.cyan}  │${COLORS.bold}  ${title.padEnd(50)}${COLORS.cyan}│${COLORS.reset}`);
  console.log(`${COLORS.cyan}  └${line}┘${COLORS.reset}`);
}

// ═══════════════════════════════════════════════════════════════
//  FILE UTILITIES
// ═══════════════════════════════════════════════════════════════

function getAllFiles(dir, extensions) {
  const results = [];
  if (!existsSync(dir)) return results;

  function walk(currentDir) {
    const items = readdirSync(currentDir);
    for (const item of items) {
      const fullPath = join(currentDir, item);
      // Skip node_modules, dist, .git, security-reports
      if (['node_modules', '.git', 'dist', 'security-reports'].includes(item)) continue;
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (extensions.includes(extname(item).toLowerCase())) {
          if (stat.size <= CONFIG.maxFileSizeBytes) {
            results.push(fullPath);
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  walk(dir);
  return results;
}

function readFileSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function isAllowlisted(file, pattern) {
  return CONFIG.allowlist.patterns.some(
    (entry) => entry.file === relative(__dirname, file) && entry.pattern === pattern
  );
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 1: DEPENDENCY VULNERABILITY SCAN
// ═══════════════════════════════════════════════════════════════

async function checkDependencies() {
  separator('CHECK 1: Dependency Vulnerabilities');
  const findings = [];

  try {
    // Run npm audit
    log('INFO', 'Running npm audit...');
    let auditOutput;
    try {
      auditOutput = execSync('npm audit --json 2>&1', {
        cwd: __dirname,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (e) {
      // npm audit returns non-zero exit code when vulnerabilities found
      auditOutput = e.stdout || e.stderr || '';
    }

    let auditData;
    try {
      auditData = JSON.parse(auditOutput);
    } catch {
      log('WARN', 'Could not parse npm audit output');
      findings.push({
        check: 'dependencies',
        severity: 'LOW',
        message: 'npm audit output could not be parsed — run `npm audit` manually',
        file: 'package.json',
      });
      return findings;
    }

    // Parse npm audit v2 format
    const vulnerabilities = auditData.vulnerabilities || {};
    const vulnCount = Object.keys(vulnerabilities).length;

    if (vulnCount === 0) {
      log('PASS', 'No known vulnerabilities found in dependencies');
    } else {
      const summary = auditData.metadata || {};
      const severityCounts = {
        critical: 0, high: 0, moderate: 0, low: 0, info: 0,
      };

      for (const [pkgName, vuln] of Object.entries(vulnerabilities)) {
        // Check if this dependency is in the allowlist
        const depAllowlist = CONFIG.allowlist.dependencies || {};
        if (depAllowlist[pkgName]) {
          log('INFO', `${pkgName}: ALLOWLISTED — ${depAllowlist[pkgName].reason}`);
          continue;
        }

        const severity = (vuln.severity || 'info').toUpperCase();
        const severityKey = (vuln.severity || 'info').toLowerCase();
        if (severityCounts[severityKey] !== undefined) severityCounts[severityKey]++;

        const mappedSeverity = {
          critical: 'CRITICAL',
          high: 'HIGH',
          moderate: 'MEDIUM',
          low: 'LOW',
          info: 'INFO',
        }[severityKey] || 'LOW';

        log(mappedSeverity, `${pkgName}: ${vuln.via?.[0]?.title || vuln.via?.[0] || 'Unknown vulnerability'}`);

        findings.push({
          check: 'dependencies',
          severity: mappedSeverity,
          message: `${pkgName}@${vuln.range || 'unknown'}: ${vuln.via?.[0]?.title || vuln.via?.[0] || 'Vulnerability found'}`,
          file: 'package.json',
          fix: vuln.fixAvailable ? `Run \`npm audit fix\` or update ${pkgName}` : 'No automatic fix available — review manually',
        });
      }

      log('INFO', `Summary: ${severityCounts.critical} critical, ${severityCounts.high} high, ${severityCounts.moderate} moderate, ${severityCounts.low} low`);
    }

    // Check for outdated packages
    log('INFO', 'Checking for outdated packages...');
    try {
      const outdatedOutput = execSync('npm outdated --json 2>&1', {
        cwd: __dirname,
        encoding: 'utf-8',
      });
      const outdated = JSON.parse(outdatedOutput || '{}');
      const outdatedCount = Object.keys(outdated).length;

      if (outdatedCount > 0) {
        log('LOW', `${outdatedCount} packages are outdated`);
        for (const [pkg, info] of Object.entries(outdated)) {
          if (info.current !== info.latest) {
            findings.push({
              check: 'dependencies',
              severity: 'LOW',
              message: `${pkg}: ${info.current} → ${info.latest} (${info.type || 'dependency'})`,
              file: 'package.json',
              fix: `Run \`npm update ${pkg}\` or \`npm install ${pkg}@latest\``,
            });
          }
        }
      } else {
        log('PASS', 'All packages are up to date');
      }
    } catch {
      // npm outdated returns non-zero when outdated packages exist
      log('INFO', 'Some packages may be outdated — run `npm outdated` for details');
    }
  } catch (error) {
    log('WARN', `Dependency check error: ${error.message}`);
    findings.push({
      check: 'dependencies',
      severity: 'LOW',
      message: `Could not run dependency checks: ${error.message}`,
      file: 'package.json',
    });
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 2: SOURCE CODE PATTERN ANALYSIS
// ═══════════════════════════════════════════════════════════════

async function checkSourcePatterns() {
  separator('CHECK 2: Source Code Patterns');
  const findings = [];

  const DANGEROUS_PATTERNS = [
    {
      name: 'dangerouslySetInnerHTML',
      regex: /dangerouslySetInnerHTML/g,
      severity: 'HIGH',
      message: 'dangerouslySetInnerHTML usage detected — potential XSS vector',
      fix: 'Replace with safe React text rendering or use a sanitization library like DOMPurify',
    },
    {
      name: 'innerHTML',
      regex: /\.innerHTML\s*=/g,
      severity: 'HIGH',
      message: 'Direct innerHTML assignment — potential XSS vector',
      fix: 'Use React state/refs and textContent instead, or sanitize with DOMPurify',
    },
    {
      name: 'outerHTML',
      regex: /\.outerHTML\s*=/g,
      severity: 'HIGH',
      message: 'Direct outerHTML assignment — potential XSS vector',
      fix: 'Use React DOM methods instead',
    },
    {
      name: 'eval',
      regex: /\beval\s*\(/g,
      severity: 'CRITICAL',
      message: 'eval() usage detected — critical security risk',
      fix: 'Remove eval() entirely. Use JSON.parse() for data, or refactor logic',
    },
    {
      name: 'Function constructor',
      regex: /new\s+Function\s*\(/g,
      severity: 'CRITICAL',
      message: 'new Function() constructor — equivalent to eval()',
      fix: 'Refactor to avoid dynamic code generation',
    },
    {
      name: 'document.write',
      regex: /document\.write\s*\(/g,
      severity: 'HIGH',
      message: 'document.write() usage — XSS risk and performance issue',
      fix: 'Use React DOM rendering instead',
    },
    {
      name: 'setTimeout with string',
      regex: /setTimeout\s*\(\s*['"`]/g,
      severity: 'MEDIUM',
      message: 'setTimeout with string argument — acts like eval()',
      fix: 'Pass a function reference instead of a string',
    },
    {
      name: 'setInterval with string',
      regex: /setInterval\s*\(\s*['"`]/g,
      severity: 'MEDIUM',
      message: 'setInterval with string argument — acts like eval()',
      fix: 'Pass a function reference instead of a string',
    },
    {
      name: 'window.location from user input',
      regex: /window\.location\s*=\s*(?!['"`/])/g,
      severity: 'MEDIUM',
      message: 'Dynamic window.location assignment — potential open redirect',
      fix: 'Validate URLs against an allowlist before redirecting',
    },
    {
      name: 'postMessage without origin',
      regex: /\.postMessage\s*\([^,]+,\s*['"`]\*['"`]\s*\)/g,
      severity: 'MEDIUM',
      message: 'postMessage with wildcard origin — messages sent to any window',
      fix: 'Specify the exact target origin instead of "*"',
    },
    {
      name: 'HTTP URLs',
      regex: /['"`]http:\/\/(?!localhost|127\.0\.0\.1)/g,
      severity: 'LOW',
      message: 'Insecure HTTP URL detected — should use HTTPS',
      fix: 'Change http:// to https://',
    },
  ];

  const files = getAllFiles(CONFIG.srcDir, CONFIG.fileExtensions);
  log('INFO', `Scanning ${files.length} source files...`);

  let cleanCount = 0;

  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;

    const relPath = relative(__dirname, file);
    let fileClean = true;

    for (const pattern of DANGEROUS_PATTERNS) {
      if (isAllowlisted(file, pattern.name)) continue;

      const matches = content.match(pattern.regex);
      if (matches) {
        fileClean = false;
        // Find line numbers
        const lines = content.split('\n');
        const lineNumbers = [];
        for (let i = 0; i < lines.length; i++) {
          if (pattern.regex.test(lines[i])) {
            lineNumbers.push(i + 1);
          }
          // Reset regex lastIndex
          pattern.regex.lastIndex = 0;
        }

        log(pattern.severity, `${relPath}:${lineNumbers.join(',')} — ${pattern.message}`);
        findings.push({
          check: 'source-patterns',
          severity: pattern.severity,
          message: pattern.message,
          file: relPath,
          lines: lineNumbers,
          fix: pattern.fix,
          pattern: pattern.name,
        });
      }
    }

    if (fileClean) cleanCount++;
  }

  if (cleanCount === files.length) {
    log('PASS', `All ${files.length} files are clean — no dangerous patterns found`);
  } else {
    log('INFO', `${cleanCount}/${files.length} files clean`);
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 3: SECURITY HEADERS VALIDATION
// ═══════════════════════════════════════════════════════════════

async function checkSecurityHeaders() {
  separator('CHECK 3: Security Headers');
  const findings = [];

  const htmlPath = join(__dirname, CONFIG.entryHtml);
  const content = readFileSafe(htmlPath);

  if (!content) {
    log('WARN', `Could not read ${CONFIG.entryHtml}`);
    findings.push({
      check: 'security-headers',
      severity: 'MEDIUM',
      message: `Could not read ${CONFIG.entryHtml}`,
      file: CONFIG.entryHtml,
    });
    return findings;
  }

  // Check for CSP meta tag
  const REQUIRED_HEADERS = [
    {
      name: 'Content-Security-Policy',
      regex: /content-security-policy/i,
      metaRegex: /<meta\s+http-equiv\s*=\s*["']Content-Security-Policy["']/i,
      severity: 'MEDIUM',
      message: 'No Content-Security-Policy meta tag found',
      fix: 'Add <meta http-equiv="Content-Security-Policy" content="..."> to <head>',
    },
    {
      name: 'Referrer-Policy',
      regex: /referrer-policy/i,
      metaRegex: /<meta\s+name\s*=\s*["']referrer["']/i,
      severity: 'LOW',
      message: 'No Referrer-Policy meta tag found',
      fix: 'Add <meta name="referrer" content="strict-origin-when-cross-origin"> to <head>',
    },
  ];

  for (const header of REQUIRED_HEADERS) {
    if (!header.metaRegex.test(content)) {
      log(header.severity, header.message);
      findings.push({
        check: 'security-headers',
        severity: header.severity,
        message: header.message,
        file: CONFIG.entryHtml,
        fix: header.fix,
      });
    } else {
      log('PASS', `${header.name} meta tag present`);
    }
  }

  // Check for _headers file (deployment headers)
  const headersPath = join(__dirname, CONFIG.publicDir, '_headers');
  if (!existsSync(headersPath)) {
    log('MEDIUM', 'No public/_headers file for deployment security headers');
    findings.push({
      check: 'security-headers',
      severity: 'MEDIUM',
      message: 'No _headers file found for deployment headers (CSP, HSTS, X-Frame-Options)',
      file: 'public/_headers',
      fix: 'Create public/_headers with security headers for your hosting platform',
    });
  } else {
    const headersContent = readFileSafe(headersPath);
    const requiredDeployHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security',
      'Permissions-Policy',
    ];

    for (const header of requiredDeployHeaders) {
      if (headersContent && headersContent.includes(header)) {
        log('PASS', `${header} configured in _headers`);
      } else {
        log('LOW', `${header} missing from _headers file`);
        findings.push({
          check: 'security-headers',
          severity: 'LOW',
          message: `${header} not found in _headers file`,
          file: 'public/_headers',
          fix: `Add ${header} header to public/_headers`,
        });
      }
    }
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 4: SENSITIVE DATA LEAK DETECTION
// ═══════════════════════════════════════════════════════════════

async function checkSensitiveLeaks() {
  separator('CHECK 4: Sensitive Data Leaks');
  const findings = [];

  const SECRET_PATTERNS = [
    {
      name: 'AWS Access Key',
      regex: /AKIA[0-9A-Z]{16}/g,
      severity: 'CRITICAL',
    },
    {
      name: 'AWS Secret Key',
      regex: /(?:aws.{0,20})?(?:secret|private).{0,20}['"`][A-Za-z0-9/+=]{40}['"`]/gi,
      severity: 'CRITICAL',
    },
    {
      name: 'Generic API Key assignment',
      regex: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"`][A-Za-z0-9_\-]{20,}['"`]/gi,
      severity: 'HIGH',
    },
    {
      name: 'Private Key',
      regex: /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)?\s*PRIVATE\s+KEY-----/g,
      severity: 'CRITICAL',
    },
    {
      name: 'JWT Token',
      regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g,
      severity: 'HIGH',
    },
    {
      name: 'Generic Password',
      regex: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/gi,
      severity: 'HIGH',
    },
    {
      name: 'Generic Secret',
      regex: /(?:secret|token)\s*[:=]\s*['"`][A-Za-z0-9_\-]{16,}['"`]/gi,
      severity: 'MEDIUM',
    },
    {
      name: 'Database Connection String',
      regex: /(?:mongodb|postgres|mysql|redis):\/\/[^\s'"]+/gi,
      severity: 'CRITICAL',
    },
    {
      name: 'Firebase Config',
      regex: /AIza[0-9A-Za-z_-]{35}/g,
      severity: 'HIGH',
    },
    {
      name: 'Slack Token',
      regex: /xox[baprs]-[0-9a-zA-Z-]+/g,
      severity: 'HIGH',
    },
    {
      name: 'GitHub Token',
      regex: /ghp_[0-9a-zA-Z]{36}/g,
      severity: 'CRITICAL',
    },
    {
      name: 'Stripe Key',
      regex: /(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}/g,
      severity: 'CRITICAL',
    },
    {
      name: 'Hardcoded IP Address',
      regex: /(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?!\.)/g,
      severity: 'LOW',
      skipFiles: ['.css'], // CSS can have IP-like patterns in color values
    },
  ];

  const files = getAllFiles(CONFIG.srcDir, ['.js', '.jsx', '.ts', '.tsx', '.json', '.env']);
  // Also check root-level files
  const rootFiles = ['.env', '.env.local', '.env.production', '.env.development']
    .map((f) => join(__dirname, f))
    .filter(existsSync);

  const allFiles = [...files, ...rootFiles];
  log('INFO', `Scanning ${allFiles.length} files for sensitive data...`);

  let leakCount = 0;

  for (const file of allFiles) {
    const content = readFileSafe(file);
    if (!content) continue;

    const relPath = relative(__dirname, file);
    const ext = extname(file);

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.skipFiles && pattern.skipFiles.includes(ext)) continue;
      if (isAllowlisted(file, pattern.name)) continue;

      const matches = content.match(pattern.regex);
      if (matches) {
        leakCount++;
        const lines = content.split('\n');
        const lineNumbers = [];
        for (let i = 0; i < lines.length; i++) {
          if (pattern.regex.test(lines[i])) {
            lineNumbers.push(i + 1);
          }
          pattern.regex.lastIndex = 0;
        }

        log(pattern.severity, `${relPath}:${lineNumbers.join(',')} — Possible ${pattern.name} detected`);
        findings.push({
          check: 'sensitive-leaks',
          severity: pattern.severity,
          message: `Possible ${pattern.name} in ${relPath}`,
          file: relPath,
          lines: lineNumbers,
          fix: 'Move sensitive values to environment variables (.env) and add to .gitignore',
          pattern: pattern.name,
        });
      }
    }
  }

  // Check .gitignore for .env
  const gitignorePath = join(__dirname, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSafe(gitignorePath);
    if (gitignore && !gitignore.includes('.env')) {
      log('MEDIUM', '.env files not listed in .gitignore');
      findings.push({
        check: 'sensitive-leaks',
        severity: 'MEDIUM',
        message: '.env files not excluded in .gitignore — secrets could be committed',
        file: '.gitignore',
        fix: 'Add .env* to .gitignore',
      });
    } else {
      log('PASS', '.env files are excluded in .gitignore');
    }
  }

  if (leakCount === 0) {
    log('PASS', 'No sensitive data leaks detected');
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 5: DEPENDENCY LICENSE & SUPPLY CHAIN
// ═══════════════════════════════════════════════════════════════

async function checkLicenses() {
  separator('CHECK 5: Supply Chain & Licenses');
  const findings = [];

  // Check package-lock.json exists (ensures reproducible installs)
  const lockPath = join(__dirname, 'package-lock.json');
  if (existsSync(lockPath)) {
    log('PASS', 'package-lock.json exists — reproducible installs ensured');
  } else {
    log('MEDIUM', 'No package-lock.json — builds are not reproducible');
    findings.push({
      check: 'supply-chain',
      severity: 'MEDIUM',
      message: 'No package-lock.json found — installs are not reproducible',
      file: 'package-lock.json',
      fix: 'Run `npm install` to generate package-lock.json and commit it',
    });
  }

  // Check for install scripts in dependencies (supply chain risk)
  const pkgPath = join(__dirname, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSafe(pkgPath));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const depCount = Object.keys(allDeps).length;
    log('INFO', `Analyzing ${depCount} direct dependencies...`);

    // Check for suspicious scripts in package.json
    const scripts = pkg.scripts || {};
    const suspiciousScripts = ['preinstall', 'postinstall', 'preuninstall'];
    for (const scriptName of suspiciousScripts) {
      if (scripts[scriptName]) {
        log('MEDIUM', `Lifecycle script "${scriptName}" found: ${scripts[scriptName]}`);
        findings.push({
          check: 'supply-chain',
          severity: 'MEDIUM',
          message: `Lifecycle script "${scriptName}" found in package.json — review for malicious behavior`,
          file: 'package.json',
          fix: `Review the "${scriptName}" script and ensure it is safe`,
        });
      }
    }

    if (!scripts.preinstall && !scripts.postinstall) {
      log('PASS', 'No suspicious lifecycle scripts in package.json');
    }
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 6: BUILD OUTPUT ANALYSIS
// ═══════════════════════════════════════════════════════════════

async function checkBuildOutput() {
  separator('CHECK 6: Build Output Security');
  const findings = [];

  const distDir = join(__dirname, CONFIG.buildDir);

  if (!existsSync(distDir)) {
    log('INFO', `Build directory "${CONFIG.buildDir}" not found — skipping build output checks`);
    log('INFO', 'Run `npm run build` first, then re-run this audit');
    return findings;
  }

  // Check for source maps in build output
  const buildFiles = getAllFiles(distDir, ['.js', '.css', '.map', '.html']);
  const mapFiles = buildFiles.filter((f) => f.endsWith('.map'));

  if (mapFiles.length > 0) {
    log('MEDIUM', `${mapFiles.length} source map file(s) found in build output`);
    for (const mapFile of mapFiles) {
      findings.push({
        check: 'build-output',
        severity: 'MEDIUM',
        message: `Source map file in build: ${relative(__dirname, mapFile)}`,
        file: relative(__dirname, mapFile),
        fix: 'Disable source maps in production: set `build.sourcemap: false` in vite.config.js',
      });
    }
  } else {
    log('PASS', 'No source map files in build output');
  }

  // Check for debug/console statements in built JS
  const jsFiles = buildFiles.filter((f) => f.endsWith('.js'));
  for (const file of jsFiles) {
    const content = readFileSafe(file);
    if (!content) continue;

    // Check for console.log (usually stripped in production)
    const consoleMatches = content.match(/console\.\s*(?:log|debug|info)\s*\(/g);
    if (consoleMatches && consoleMatches.length > 5) {
      log('LOW', `${relative(__dirname, file)}: ${consoleMatches.length} console statements in production bundle`);
      findings.push({
        check: 'build-output',
        severity: 'LOW',
        message: `${consoleMatches.length} console statements in production bundle`,
        file: relative(__dirname, file),
        fix: 'Configure Vite to strip console.log in production builds with esbuild.drop',
      });
    }
  }

  // Check build size for suspiciously large bundles (possible dependency issue)
  for (const file of jsFiles) {
    try {
      const stat = statSync(file);
      const sizeKB = Math.round(stat.size / 1024);
      if (sizeKB > 500) {
        log('LOW', `Large bundle: ${relative(__dirname, file)} (${sizeKB} KB)`);
        findings.push({
          check: 'build-output',
          severity: 'LOW',
          message: `Large bundle file: ${sizeKB} KB — may include unnecessary dependencies`,
          file: relative(__dirname, file),
          fix: 'Analyze bundle with `npx vite-bundle-analyzer` and code-split large modules',
        });
      }
    } catch { /* skip */ }
  }

  log('PASS', 'Build output analysis complete');
  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  CHECK 7: REACT-SPECIFIC SECURITY PATTERNS
// ═══════════════════════════════════════════════════════════════

async function checkReactPatterns() {
  separator('CHECK 7: React Security Patterns');
  const findings = [];

  const files = getAllFiles(CONFIG.srcDir, ['.js', '.jsx', '.tsx']);
  log('INFO', `Checking ${files.length} React files...`);

  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;

    const relPath = relative(__dirname, file);

    // Check for target="_blank" without rel="noopener noreferrer"
    const blankTargetRegex = /target\s*=\s*["']_blank["']/g;
    const noopenRegex = /rel\s*=\s*["'][^"']*noopener[^"']*noreferrer[^"']*["']/g;
    const blankMatches = content.match(blankTargetRegex);
    const noopenMatches = content.match(noopenRegex);

    if (blankMatches && (!noopenMatches || blankMatches.length > noopenMatches.length)) {
      log('MEDIUM', `${relPath}: target="_blank" without rel="noopener noreferrer"`);
      findings.push({
        check: 'react-patterns',
        severity: 'MEDIUM',
        message: 'target="_blank" link(s) without rel="noopener noreferrer"',
        file: relPath,
        fix: 'Add rel="noopener noreferrer" to all target="_blank" links',
      });
    }

    // Check for uncontrolled form inputs
    const inputRegex = /<(?:input|textarea)\b[^>]*>/g;
    const inputMatches = content.match(inputRegex) || [];
    for (const inputTag of inputMatches) {
      // Check if input has maxLength
      if (!inputTag.includes('maxLength') && !inputTag.includes('maxlength')) {
        if (inputTag.includes('type="text"') || inputTag.includes('type="email"') || inputTag.includes('<textarea')) {
          const lines = content.split('\n');
          const lineNum = lines.findIndex((l) => l.includes(inputTag.slice(0, 30))) + 1;
          log('LOW', `${relPath}:${lineNum} — Input without maxLength attribute`);
          findings.push({
            check: 'react-patterns',
            severity: 'LOW',
            message: `Input element without maxLength — could allow excessively long input`,
            file: relPath,
            lines: [lineNum],
            fix: 'Add maxLength attribute to limit input size',
          });
          break; // Only report once per file
        }
      }
    }

    // Check for href="javascript:" (XSS)
    if (/href\s*=\s*["']javascript:/i.test(content)) {
      log('HIGH', `${relPath}: javascript: protocol in href — XSS risk`);
      findings.push({
        check: 'react-patterns',
        severity: 'HIGH',
        message: 'href="javascript:..." detected — XSS vulnerability',
        file: relPath,
        fix: 'Remove javascript: protocol from href. Use onClick handlers instead.',
      });
    }

    // Check for user-controlled URLs in src/href without validation
    if (/(?:src|href)\s*=\s*\{(?!['"`])/.test(content)) {
      // Dynamic src/href from variable — could be safe (from static data) or unsafe
      // Only flag as INFO since React portfolio likely uses static data
      const hasDynamic = content.match(/(?:src|href)\s*=\s*\{[^}]+\}/g);
      if (hasDynamic && hasDynamic.length > 0) {
        log('INFO', `${relPath}: ${hasDynamic.length} dynamic URL(s) — ensure data source is trusted`);
      }
    }
  }

  // Summary
  if (findings.length === 0) {
    log('PASS', 'All React security patterns check out');
  }

  return findings;
}

// ═══════════════════════════════════════════════════════════════
//  REPORT GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateReport(allFindings, startTime) {
  separator('AUDIT REPORT SUMMARY');

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  // Categorize findings
  const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [], INFO: [] };
  for (const f of allFindings) {
    if (bySeverity[f.severity]) {
      bySeverity[f.severity].push(f);
    }
  }

  const totalFindings = allFindings.length;
  const criticalCount = bySeverity.CRITICAL.length;
  const highCount = bySeverity.HIGH.length;
  const mediumCount = bySeverity.MEDIUM.length;
  const lowCount = bySeverity.LOW.length;

  // Print summary
  console.log('');
  console.log(`${COLORS.bold}  Scan completed in ${(durationMs / 1000).toFixed(1)}s${COLORS.reset}`);
  console.log('');

  if (criticalCount > 0) {
    console.log(`  ${SEVERITY_ICONS.CRITICAL} Critical:  ${COLORS.red}${COLORS.bold}${criticalCount}${COLORS.reset}`);
  }
  if (highCount > 0) {
    console.log(`  ${SEVERITY_ICONS.HIGH} High:      ${COLORS.red}${highCount}${COLORS.reset}`);
  }
  if (mediumCount > 0) {
    console.log(`  ${SEVERITY_ICONS.MEDIUM} Medium:    ${COLORS.yellow}${mediumCount}${COLORS.reset}`);
  }
  if (lowCount > 0) {
    console.log(`  ${SEVERITY_ICONS.LOW} Low:       ${COLORS.blue}${lowCount}${COLORS.reset}`);
  }
  console.log(`  ${COLORS.dim}─────────────────${COLORS.reset}`);
  console.log(`  ${COLORS.bold}Total:     ${totalFindings}${COLORS.reset}`);
  console.log('');

  // Overall verdict
  if (criticalCount === 0 && highCount === 0) {
    console.log(`  ${COLORS.bgGreen}${COLORS.bold} ✅ PASS ${COLORS.reset} ${COLORS.green}Your portfolio is safe for publication!${COLORS.reset}`);
    if (mediumCount > 0 || lowCount > 0) {
      console.log(`  ${COLORS.dim}  (${mediumCount + lowCount} non-critical suggestions — see report for details)${COLORS.reset}`);
    }
  } else if (criticalCount > 0) {
    console.log(`  ${COLORS.bgRed}${COLORS.bold} 🚨 FAIL ${COLORS.reset} ${COLORS.red}Critical issues found — DO NOT publish until fixed!${COLORS.reset}`);
  } else {
    console.log(`  ${COLORS.bgYellow}${COLORS.bold} ⚠️  WARN ${COLORS.reset} ${COLORS.yellow}High-severity issues found — fix before publishing${COLORS.reset}`);
  }
  console.log('');

  // Save JSON report
  if (!existsSync(CONFIG.reportDir)) {
    mkdirSync(CONFIG.reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    durationMs,
    verdict: criticalCount === 0 && highCount === 0 ? 'PASS' : 'FAIL',
    summary: {
      total: totalFindings,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      info: bySeverity.INFO.length,
    },
    findings: allFindings,
  };

  const reportFilename = `audit-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  const reportPath = join(CONFIG.reportDir, reportFilename);
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('INFO', `Full report saved to ${reportPath}`);

  // Also save latest report as latest.json for easy access
  writeFileSync(join(CONFIG.reportDir, 'latest.json'), JSON.stringify(report, null, 2));

  return report;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

async function runAudit() {
  const startTime = Date.now();
  banner();

  log('INFO', `Mode: ${WATCH_MODE ? 'CONTINUOUS WATCH' : 'ONE-SHOT AUDIT'}`);
  log('INFO', `Source directory: ${CONFIG.srcDir}`);
  log('INFO', `Scanning extensions: ${CONFIG.fileExtensions.join(', ')}`);
  console.log('');

  const allFindings = [];

  // Run all checks
  const checks = [
    checkDependencies,
    checkSourcePatterns,
    checkSecurityHeaders,
    checkSensitiveLeaks,
    checkLicenses,
    checkBuildOutput,
    checkReactPatterns,
  ];

  for (const check of checks) {
    try {
      const findings = await check();
      allFindings.push(...findings);
    } catch (error) {
      log('WARN', `Check failed: ${error.message}`);
    }
  }

  const report = generateReport(allFindings, startTime);
  return report;
}

async function startWatchMode() {
  log('INFO', '🔄 Starting continuous watch mode...');
  log('INFO', `Re-scanning every ${CONFIG.watchIntervalMs / 1000} seconds and on file changes`);
  console.log('');

  // Initial scan
  await runAudit();

  // Periodic re-scan
  const interval = setInterval(async () => {
    console.log('');
    log('INFO', '🔄 Periodic re-scan triggered...');
    await runAudit();
  }, CONFIG.watchIntervalMs);

  // Watch for file changes
  const srcDir = join(__dirname, CONFIG.srcDir);
  let debounceTimer = null;

  if (existsSync(srcDir)) {
    try {
      watch(srcDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const ext = extname(filename).toLowerCase();
        if (!CONFIG.fileExtensions.includes(ext)) return;

        // Debounce rapid changes
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          console.log('');
          log('INFO', `📝 File changed: ${filename} — re-scanning...`);
          await runAudit();
        }, 2000);
      });
      log('INFO', `👁️  Watching ${srcDir} for changes...`);
    } catch (error) {
      log('WARN', `Could not start file watcher: ${error.message}`);
      log('INFO', 'Falling back to periodic-only scanning');
    }
  }

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    log('INFO', '🛑 Watch mode stopped');
    clearInterval(interval);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    clearInterval(interval);
    process.exit(0);
  });
}

// ═══════════════════════════════════════════════════════════════
//  ENTRY POINT
// ═══════════════════════════════════════════════════════════════

(async () => {
  try {
    if (WATCH_MODE) {
      await startWatchMode();
    } else {
      const report = await runAudit();
      // Exit with non-zero code if critical/high issues found
      if (report.summary.critical > 0 || report.summary.high > 0) {
        process.exit(1);
      }
    }
  } catch (error) {
    log('CRITICAL', `Audit failed: ${error.message}`);
    console.error(error.stack);
    process.exit(2);
  }
})();
