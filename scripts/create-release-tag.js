const { execSync } = require("child_process");

const version = process.argv[2];

if (!version || !/^v?\d+\.\d+\.\d+$/.test(version)) {
  console.error("❌ Please provide a valid semver version like v1.2.3");
  process.exit(1);
}

try {
  const parsedVersion = version.startsWith("v") ? version : `v${version}`;
  execSync(`git tag ${parsedVersion} -m "Release ${parsedVersion}"`, {
    stdio: "inherit",
  });
  execSync(`git push origin ${parsedVersion}`, { stdio: "inherit" });

  console.log(`✅ Tag ${parsedVersion} created and pushed.`);
} catch (err) {
  console.error("❌ Failed to create or push tag:", err.message);
  process.exit(1);
}
