import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(readFileSync(join(__dirname, "../examples/sample-lead.json"), "utf-8"));

const port = process.env.PORT ?? "3000";
const url = `http://localhost:${port}/api/leads`;

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sample),
  });
  const body = await res.json();
  console.log(res.status, body);
}

main().catch((err) => {
  console.error("Failed to seed lead — is `npm run dev` running in another terminal?", err);
  process.exit(1);
});
