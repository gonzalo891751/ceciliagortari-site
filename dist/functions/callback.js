export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
        return new Response("Missing code param", { status: 400 });
    }

    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return new Response("GitHub Client ID or Secret not configured", { status: 500 });
    }

    try {
        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Cloudflare-Pages-Auth"
            },
            body: JSON.stringify({
                client_id: env.GITHUB_CLIENT_ID,
                client_secret: env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const result = await response.json();

        if (result.error) {
            return new Response(`GitHub OAuth Error: ${result.error_description}`, { status: 400 });
        }

        const token = result.access_token;
        const provider = "github";

        // Generate the HTML that sends the message back to the main window
        const html = `
        <!doctype html>
        <html>
        <body>
        <script>
            (function() {
                function receiveMessage(e) {
                    console.log("Sending authorization message");
                    // Format: authorization:provider:status:data
                    // Sveltia/Decap expects this format
                    window.opener.postMessage(
                        'authorization:${provider}:success:${JSON.stringify({ token })}',
                        '*'
                    );
                    window.close();
                }
                receiveMessage();
            })();
        </script>
        </body>
        </html>`;

        return new Response(html, {
            headers: {
                "Content-Type": "text/html;charset=UTF-8",
            },
        });

    } catch (error) {
        return new Response(`Function Error: ${error.message}`, { status: 500 });
    }
}
