import { type ChildProcess, spawn } from "node:child_process";
import {
	cp,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { assertLocalRequest } from "../../packages/quality/isolation";

let fixture: string;
let server: ChildProcess;
let logs = "";
test.beforeAll(async () => {
	await new Promise<void>((done, fail) => {
		const probe = createServer();
		probe.once("error", fail);
		probe.listen(27046, "127.0.0.1", () => probe.close(() => done()));
	});
	fixture = await mkdtemp(join(tmpdir(), "lizheng-dev-test-"));
	for (const path of [
		"apps",
		"packages",
		"scripts",
		"design-public",
		"assets/fonts",
		"docs/content",
		"package.json",
	])
		await cp(resolve(path), join(fixture, path), { recursive: true });
	await symlink(resolve("node_modules"), join(fixture, "node_modules"), "dir");
	server = spawn("bun", [join(fixture, "scripts", "dev.ts"), "--test"], {
		cwd: fixture,
		stdio: ["ignore", "pipe", "pipe"],
	});
	server.stdout?.on("data", (data) => {
		logs += data;
	});
	server.stderr?.on("data", (data) => {
		logs += data;
	});
	await expect
		.poll(
			async () => {
				try {
					return (await fetch("http://127.0.0.1:27046/api/live")).status;
				} catch {
					return 0;
				}
			},
			{ timeout: 20000, message: "isolated Vite server is ready" },
		)
		.toBe(200);
});
test.afterAll(async () => {
	if (server && server.exitCode === null) {
		server.kill("SIGTERM");
		await new Promise<void>((done) => server.once("exit", () => done()));
	}
	if (fixture) await rm(fixture, { recursive: true, force: true });
	console.info(logs);
});
test.beforeEach(async ({ context }) => {
	await context.route("**/*", (route) => {
		try {
			assertLocalRequest(route.request().url());
			return route.continue();
		} catch {
			return route.abort();
		}
	});
});

for (const surface of ["resume", "landing"])
	test(`${surface}: styles are available before JavaScript`, async ({
		page,
	}) => {
		const failedResources: string[] = [];
		page.on("response", (response) => {
			if (response.status() >= 400) failedResources.push(response.url());
		});
		await page.route("**/apps/*/client.*", (route) => route.abort());
		await page.goto(`http://${surface}.lizheng-test.localhost:27046/en/`);
		expect(
			await page.evaluate(() => document.styleSheets.length),
		).toBeGreaterThanOrEqual(2);
		expect(
			await page
				.locator("body")
				.evaluate((node) => getComputedStyle(node).fontFamily),
		).not.toMatch(/^Times/);
		await expect(
			page.locator(
				surface === "resume" ? ".resume-document" : ".console-shell",
			),
		).toBeVisible();
		if (surface === "landing")
			expect(
				await page
					.locator(".chapter-rail")
					.evaluate((node) => getComputedStyle(node).display),
			).toBe("grid");
		await page.evaluate(() => document.fonts.ready);
		expect(failedResources).toEqual([]);
	});

test("build and test artifacts never reload an editing session", async ({
	page,
}) => {
	await page.goto("http://landing.lizheng-test.localhost:27046/en/");
	await page
		.locator("html")
		.evaluate((node) => node.setAttribute("data-hmr-session", "original"));
	for (const directory of [
		"dist",
		"dist.tmp",
		".test-dist/l2",
		".test-results",
		"playwright-report",
		".design-dist",
	]) {
		await mkdir(join(fixture, directory), { recursive: true });
		await writeFile(
			join(fixture, directory, "index.html"),
			"<html><body>Generated output</body></html>",
		);
	}
	await page.waitForTimeout(600);
	await expect(page.locator("html")).toHaveAttribute(
		"data-hmr-session",
		"original",
	);
});

test("public Markdown edits refresh the visible content", async ({ page }) => {
	await page.goto("http://landing.lizheng-test.localhost:27046/en/");
	const file = join(fixture, "docs/content/03-landing-en.md");
	const original = await readFile(file, "utf8");
	try {
		await writeFile(
			file,
			original.replace(
				"Principal Software Engineering Manager",
				"Preview Content Update",
			),
		);
		await expect(page.locator(".lcd-identity p")).toContainText(
			"Preview Content Update",
		);
		expect(
			await page.evaluate(() => document.styleSheets.length),
		).toBeGreaterThanOrEqual(2);
	} finally {
		await writeFile(file, original);
	}
});

test("resume template edits refresh with styles and retain reading position", async ({
	page,
}) => {
	await page.goto("http://resume.lizheng-test.localhost:27046/en/");
	await page.locator("[data-theme-toggle]").click();
	await page.evaluate(() => scrollTo(0, 600));
	const file = join(fixture, "apps/resume/ResumePage.tsx");
	const original = await readFile(file, "utf8");
	try {
		await writeFile(
			file,
			original.replace(
				"ENGINEERING · LEADERSHIP · CURIOSITY",
				"ENGINEERING · UPDATED PREVIEW",
			),
		);
		await expect(page.getByText("ENGINEERING · UPDATED PREVIEW")).toHaveCount(
			1,
		);
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await expect.poll(() => page.evaluate(() => scrollY)).toBe(600);
		expect(
			await page.evaluate(() => document.styleSheets.length),
		).toBeGreaterThanOrEqual(2);
	} finally {
		await writeFile(file, original);
	}
});

for (const surface of ["resume", "landing"])
	test(`${surface}: CSS edits preserve the document and theme`, async ({
		page,
	}) => {
		await page.goto(`http://${surface}.lizheng-test.localhost:27046/en/`);
		await page.locator("[data-theme-toggle]").click();
		await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		await page
			.locator("html")
			.evaluate((node) => node.setAttribute("data-hmr-session", "original"));
		const file = join(fixture, `apps/${surface}/${surface}.css`);
		const original = await readFile(file, "utf8");
		try {
			await writeFile(file, `${original}\n:root { --hmr-probe: updated; }\n`);
			await expect
				.poll(() =>
					page
						.locator("html")
						.evaluate((node) =>
							getComputedStyle(node).getPropertyValue("--hmr-probe").trim(),
						),
				)
				.toBe("updated");
			await expect(page.locator("html")).toHaveAttribute(
				"data-hmr-session",
				"original",
			);
			await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
		} finally {
			await writeFile(file, original);
		}
	});

test("handheld component refresh retains the selected screen", async ({
	page,
}) => {
	await page.goto("http://landing.lizheng-test.localhost:27046/en/");
	await page.locator('[aria-label="Select: Switch screen"]').click();
	await expect(page.locator("#screen")).toHaveClass("lcd-screen panel-about");
	await page
		.locator("html")
		.evaluate((node) => node.setAttribute("data-hmr-session", "original"));
	const file = join(fixture, "apps/landing/LandingPage.tsx");
	const original = await readFile(file, "utf8");
	try {
		await writeFile(
			file,
			original.replace("PERSONAL SPACE — VOL. 01", "PERSONAL SPACE — VOL. 02"),
		);
		await expect(page.locator(".header-edition")).toHaveText(
			"PERSONAL SPACE — VOL. 02",
		);
		await expect(page.locator("html")).toHaveAttribute(
			"data-hmr-session",
			"original",
		);
		await expect(page.locator("#screen")).toHaveClass("lcd-screen panel-about");
	} finally {
		await writeFile(file, original);
	}
});
