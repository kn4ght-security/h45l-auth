
import html from "./index.html";

import { verifyLicense } from "./auth.js";
import { obfuscate } from "./obfuscator.js";
import { json, unauthorized } from "./responses.js";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === "/") {
            return new Response(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8"
                }
            });
        }

        if (request.method === "POST" && url.pathname === "/api/create-loader") {
            if (
                !env.ADMIN_TOKEN ||
                request.headers.get("Authorization") !== `Bearer ${env.ADMIN_TOKEN}`
            ) {
                return json({ error: "Unauthorized" }, 401);
            }

            if (!env.DB || !env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) {
                return json({ error: "Worker configuration is incomplete." }, 500);
            }

            let body;
            try {
                body = await request.json();
            } catch {
                return json({ error: "Invalid JSON." }, 400);
            }

            const source = body.source || "";
            const token = body.turnstileToken || "";

            if (typeof source !== "string" || !source.trim() || source.length > 100000) {
                return json({ error: "Invalid script." }, 400);
            }

            if (!token) return json({ error: "Complete CAPTCHA." }, 400);

            const form = new FormData();
            form.append("secret", env.TURNSTILE_SECRET_KEY);
            form.append("response", token);

            const captchaResponse = await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                { method: "POST", body: form }
            );

            const captcha = await captchaResponse.json();

            if (!captcha.success) {
                return json({ error: "CAPTCHA failed." }, 403);
            }

            const scriptId = crypto.randomUUID();
            const licenseKey =
                crypto.randomUUID().replaceAll("-", "") +
                crypto.randomUUID().replaceAll("-", "");

            const createdAt = new Date().toISOString();

            await env.DB.prepare(
                "INSERT INTO scripts (id, source, enabled, created_at) VALUES (?, ?, 1, ?)"
            ).bind(scriptId, source, createdAt).run();

            await env.DB.prepare(
                "INSERT INTO licenses (license_key, script_id, enabled, created_at) VALUES (?, ?, 1, ?)"
            ).bind(licenseKey, scriptId, createdAt).run();

            const loaderUrl = `${url.origin}/loader/${scriptId}?key=${licenseKey}`;
            const loadstring = `loadstring(game:HttpGet("${loaderUrl}"))()`;

            return json({
                success: true,
                scriptId,
                loaderUrl,
                loadstring
            });
        }

        if (request.method === "GET" && url.pathname.startsWith("/loader/")) {
            const acceptsHtml = (request.headers.get("Accept") || "").includes("text/html");

            if (acceptsHtml) return unauthorized();

            const scriptId = url.pathname.slice("/loader/".length);
            const key = url.searchParams.get("key");

            const source = await verifyLicense(env.DB, scriptId, key);

            if (source === null) {
                return json({ error: "Invalid or disabled license." }, 403);
            }

            return new Response(obfuscate(source), {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Cache-Control": "no-store"
                }
            });
        }

        return new Response("Not Found", { status: 404 });
    }
};
