import { deployRegistry } from "../server/services/deploy-registry";

async function runAudit() {
  console.log("=========================================");
  console.log("      SiteGenie Provider Registry Audit  ");
  console.log("=========================================");

  const providers = Object.keys(deployRegistry);
  console.log(`Found ${providers.length} registered providers.\n`);

  let passed = true;
  const auditResults = [];

  for (const name of providers) {
    const handler = (deployRegistry as any)[name];
    const hasValidate = typeof handler?.validate === "function";
    const hasDeploy = typeof handler?.deploy === "function";

    const status = hasValidate && hasDeploy ? "PASS" : "FAIL";
    if (status === "FAIL") passed = false;

    auditResults.push({
      Provider: name,
      Validate: hasValidate ? "✓ YES" : "✗ NO",
      Deploy: hasDeploy ? "✓ YES" : "✗ NO",
      Status: status
    });
  }

  console.table(auditResults);

  console.log("\n=========================================");
  if (passed) {
    console.log("  AUDIT STATUS: ALL PROVIDERS OK (PASS)  ");
  } else {
    console.log("  AUDIT STATUS: SOME PROVIDERS FAILED (FAIL) ");
  }
  console.log("=========================================");
  process.exit(passed ? 0 : 1);
}

runAudit().catch((err) => {
  console.error("Audit script crashed:", err);
  process.exit(1);
});
