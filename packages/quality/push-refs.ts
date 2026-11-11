export const ZERO_SHA = "0".repeat(40);

const HEX_SHA = /^[0-9a-f]{40}$/;

export interface PushRef {
	localRef: string;
	localSha: string;
	remoteRef: string;
	remoteSha: string;
}

export interface PushTarget {
	oid: string;
	remoteRef: string;
}

export function parsePushRefs(text: string): PushRef[] {
	const refs: PushRef[] = [];
	for (const line of text.split("\n")) {
		if (line.trim() === "") continue;
		const fields = line.trim().split(/\s+/);
		if (fields.length !== 4)
			throw new Error(`pre-push received a malformed ref line: ${line.trim()}`);
		const [localRef, localSha, remoteRef, remoteSha] = fields as [
			string,
			string,
			string,
			string,
		];
		for (const sha of [localSha, remoteSha])
			if (!HEX_SHA.test(sha))
				throw new Error(`pre-push received a malformed commit sha: ${sha}`);
		refs.push({ localRef, localSha, remoteRef, remoteSha });
	}
	if (refs.length === 0)
		throw new Error(
			"pre-push received no refs; refusing to verify an unknown push",
		);
	return refs;
}

export function selectPushTargets(
	refs: PushRef[],
	context: { head: string; hasCommit: (sha: string) => boolean },
): { deletions: string[]; targets: PushTarget[] } {
	const deletions: string[] = [];
	const targets: PushTarget[] = [];
	const seen = new Set<string>();
	for (const ref of refs) {
		if (ref.localSha === ZERO_SHA) {
			deletions.push(ref.remoteRef);
			continue;
		}
		if (!context.hasCommit(ref.localSha))
			throw new Error(
				`pre-push cannot verify ${ref.remoteRef}: commit ${ref.localSha} is not in this repository`,
			);
		if (ref.localSha !== context.head)
			throw new Error(
				`pre-push cannot verify ${ref.remoteRef}: pushed commit ${ref.localSha} is not HEAD (${context.head}); check out that commit and push again`,
			);
		if (seen.has(ref.localSha)) continue;
		seen.add(ref.localSha);
		targets.push({ oid: ref.localSha, remoteRef: ref.remoteRef });
	}
	return { deletions, targets };
}
