import { createHash } from "node:crypto";
import { themeScript } from "../experience/theme-bootstrap";

export const securityHeaders = {
	"Content-Security-Policy": `default-src 'none'; script-src 'self' 'sha256-${createHash("sha256").update(themeScript).digest("base64")}'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; upgrade-insecure-requests`,
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
	"X-Frame-Options": "DENY",
};
