
export async function verifyLicense(db, scriptId, licenseKey) {
    if (!db || !scriptId || !licenseKey) return null;

    const result = await db.prepare(`
        SELECT scripts.source
        FROM scripts
        INNER JOIN licenses
        ON licenses.script_id = scripts.id
        WHERE scripts.id = ?
        AND licenses.license_key = ?
        AND scripts.enabled = 1
        AND licenses.enabled = 1
        LIMIT 1
    `).bind(scriptId, licenseKey).first();

    return result ? result.source : null;
}
