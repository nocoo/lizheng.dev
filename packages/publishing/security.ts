import { createHash } from "node:crypto";
import { themeScript } from "../experience/theme-bootstrap";
import { TRAKS_COLLECT_ORIGIN, traksStubScript } from "./traks-collect";

const scriptSrc = [
	"'self'",
	`'sha256-${createHash("sha256").update(themeScript).digest("base64")}'`,
	`'sha256-${createHash("sha256").update(traksStubScript).digest("base64")}'`,
	TRAKS_COLLECT_ORIGIN,
].join(" ");

export const securityHeaders = {
	"Content-Security-Policy": `default-src 'none'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${TRAKS_COLLECT_ORIGIN}; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests`,
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"X-Frame-Options": "DENY",
};
