
export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        }
    });
}

export function unauthorized() {
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Unauthorized</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {
                    background: #090d16;
                    color: white;
                    font-family: Arial;
                    text-align: center;
                    padding: 100px 20px;
                }
            </style>
        </head>
        <body>
            <h1>Unauthorized</h1>
            <p>This endpoint requires an authorized loader request.</p>
        </body>
        </html>
    `, {
        status: 401,
        headers: {
            "Content-Type": "text/html; charset=utf-8"
        }
    });
}
