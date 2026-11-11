import { expect, it } from "vitest";
import {
	parsePushRefs,
	selectPushTargets,
	ZERO_SHA,
} from "../../packages/quality/push-refs";

const head = "1".repeat(40);
const other = "2".repeat(40);
const line = (localSha: string, remoteRef = "refs/heads/main") =>
	`refs/heads/main ${localSha} ${remoteRef} ${"3".repeat(40)}`;

it("parses four-field push refs and skips blank lines", () => {
	const refs = parsePushRefs(`\n${line(head)}\r\n\n`);
	expect(refs).toEqual([
		{
			localRef: "refs/heads/main",
			localSha: head,
			remoteRef: "refs/heads/main",
			remoteSha: "3".repeat(40),
		},
	]);
});

it("fails closed on missing or malformed refs", () => {
	expect(() => parsePushRefs("")).toThrow(/received no refs/);
	expect(() => parsePushRefs("\n \n")).toThrow(/received no refs/);
	expect(() => parsePushRefs("refs/heads/main")).toThrow(/malformed ref line/);
	expect(() => parsePushRefs(`${line("not-a-sha")}`)).toThrow(
		/malformed commit sha/,
	);
});

it("accepts HEAD pushes and ignores repeated refs", () => {
	const { deletions, targets } = selectPushTargets(
		[
			{
				localRef: "refs/heads/main",
				localSha: head,
				remoteRef: "refs/heads/main",
				remoteSha: ZERO_SHA,
			},
			{
				localRef: "refs/heads/copy",
				localSha: head,
				remoteRef: "refs/heads/copy",
				remoteSha: ZERO_SHA,
			},
		],
		{ head, hasCommit: () => true },
	);
	expect(deletions).toEqual([]);
	expect(targets).toEqual([{ oid: head, remoteRef: "refs/heads/main" }]);
});

it("skips deletions without source checks", () => {
	const { deletions, targets } = selectPushTargets(
		[
			{
				localRef: "(delete)",
				localSha: ZERO_SHA,
				remoteRef: "refs/heads/gone",
				remoteSha: other,
			},
		],
		{ head, hasCommit: () => true },
	);
	expect(deletions).toEqual(["refs/heads/gone"]);
	expect(targets).toEqual([]);
});

it("blocks pushes of commits that are not checked out or not present", () => {
	expect(() =>
		selectPushTargets(
			[
				{
					localRef: "refs/heads/side",
					localSha: other,
					remoteRef: "refs/heads/side",
					remoteSha: ZERO_SHA,
				},
			],
			{ head, hasCommit: () => true },
		),
	).toThrow(/is not HEAD/);
	expect(() =>
		selectPushTargets(
			[
				{
					localRef: "refs/heads/main",
					localSha: head,
					remoteRef: "refs/heads/main",
					remoteSha: ZERO_SHA,
				},
			],
			{ head, hasCommit: () => false },
		),
	).toThrow(/is not in this repository/);
});
