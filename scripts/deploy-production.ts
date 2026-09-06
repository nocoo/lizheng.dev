import { unstable_readConfig } from "wrangler";
import { deployValidatedWorker } from "../packages/quality/deploy";

const domains = await deployValidatedWorker(
	unstable_readConfig({ config: "wrangler.jsonc" }),
	{
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
		apiToken: process.env.CLOUDFLARE_API_TOKEN,
	},
	async (command) =>
		Bun.spawn(command, {
			stdin: "inherit",
			stdout: "inherit",
			stderr: "inherit",
		}).exited,
	fetch,
);
console.info(`Configured Custom Domains: ${domains.join(", ")}`);
