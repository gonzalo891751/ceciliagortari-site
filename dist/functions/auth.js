export async function onRequest(context) {
    const { env } = context;
    const client_id = env.GITHUB_CLIENT_ID;

    if (!client_id) {
        return new Response("GitHub Client ID not configured", { status: 500 });
    }

    const url = new URL(context.request.url);
    const redirect_uri = `${url.origin}/callback`;
    const state = crypto.randomUUID(); // Good practice to have state

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=repo,user&state=${state}`;

    return Response.redirect(githubAuthUrl);
}
