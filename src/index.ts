import "dotenv/config";
import { generateCalendar } from "./pipeline/generate-calendar.js";

async function main(): Promise<void> {
  await generateCalendar();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Calendar generation failed: ${message}`);
  process.exit(1);
});
