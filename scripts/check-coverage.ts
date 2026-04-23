#!/usr/bin/env bun
/**
 * L1 Coverage gate — runs bun test with coverage and enforces thresholds.
 */

const LINE_THRESHOLD = 90;
const FUNC_THRESHOLD = 85;

const proc = Bun.spawn(["bun", "test", "--coverage"], {
  stdout: "pipe",
  stderr: "pipe",
});

const [stdoutText, stderrText] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
]);
const exitCode = await proc.exited;
const output = stdoutText + stderrText;

// Print test output
process.stdout.write(stdoutText);
process.stderr.write(stderrText);

if (exitCode !== 0) {
  console.error("\n❌ Tests failed");
  process.exit(1);
}

// Parse "All files" line from bun coverage output
// Format: "All files | <funcs> | <lines> |"
const allFilesMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/);
if (!allFilesMatch) {
  console.log("\n⚠️  No coverage summary found — skipping threshold check");
  process.exit(0);
}

const funcCov = parseFloat(allFilesMatch[1]);
const lineCov = parseFloat(allFilesMatch[2]);

console.log(`\n🧪 Coverage gate (line ≥ ${LINE_THRESHOLD}%, func ≥ ${FUNC_THRESHOLD}%)`);
console.log(`   Lines:     ${lineCov}% ${lineCov >= LINE_THRESHOLD ? "✅" : "❌"}`);
console.log(`   Functions: ${funcCov}% ${funcCov >= FUNC_THRESHOLD ? "✅" : "❌"}`);

if (lineCov < LINE_THRESHOLD || funcCov < FUNC_THRESHOLD) {
  console.error("\n❌ Coverage below threshold");
  process.exit(1);
}

console.log("\n✅ Coverage gate passed");
