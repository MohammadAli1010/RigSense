import { enqueueAndRunJob } from "@/lib/jobs/service";
import { jobDefinitions } from "@/lib/jobs/registry";

async function main() {
  const [jobType, rawPayload] = process.argv.slice(2);

  if (!jobType) {
    throw new Error(
      `A job type is required. Available job types: ${jobDefinitions.map((job) => job.type).join(", ")}`,
    );
  }

  let payload: Record<string, unknown> | null = null;

  if (rawPayload) {
    const parsed = JSON.parse(rawPayload);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Job payload must be a JSON object.");
    }

    payload = parsed;
  }

  const result = await enqueueAndRunJob({
    type: jobType,
    payload,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
