import "dotenv/config";
import sample from "../examples/sample-lead.json";

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
