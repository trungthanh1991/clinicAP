export interface Env {
    THAMDINH_BUCKET: R2Bucket;
}

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Upload file: POST /upload
            if (request.method === 'POST' && path === '/upload') {
                return await handleUpload(request, env);
            }

            // Download file: GET /file/:key
            if (request.method === 'GET' && path.startsWith('/file/')) {
                const key = decodeURIComponent(path.slice(6)); // Remove '/file/' prefix
                return await handleDownload(key, env);
            }

            // Delete file: DELETE /file/:key
            if (request.method === 'DELETE' && path.startsWith('/file/')) {
                const key = decodeURIComponent(path.slice(6));
                return await handleDelete(key, env);
            }

            // List files: GET /list
            if (request.method === 'GET' && path === '/list') {
                return await handleList(env);
            }

            return new Response(JSON.stringify({ error: 'Not Found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return new Response(JSON.stringify({ error: message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
    },
};

async function handleUpload(request: Request, env: Env): Promise<Response> {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customKey = formData.get('key') as string | null;

    if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    // Generate unique key for the file
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const key = customKey || `${timestamp}-${randomId}-${file.name}`;

    // Upload to R2
    await env.THAMDINH_BUCKET.put(key, file.stream(), {
        httpMetadata: {
            contentType: file.type,
        },
        customMetadata: {
            originalName: file.name,
            size: file.size.toString(),
            uploadedAt: new Date().toISOString(),
        },
    });

    // Return the file info
    const fileUrl = `/file/${encodeURIComponent(key)}`;

    return new Response(JSON.stringify({
        success: true,
        key: key,
        url: fileUrl,
        name: file.name,
        size: file.size,
        type: file.type,
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

async function handleDownload(key: string, env: Env): Promise<Response> {
    const object = await env.THAMDINH_BUCKET.get(key);

    if (!object) {
        return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Get original filename from custom metadata
    const originalName = object.customMetadata?.originalName || key;
    headers.set('Content-Disposition', `attachment; filename="${originalName}"`);

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(object.body, { headers });
}

async function handleDelete(key: string, env: Env): Promise<Response> {
    await env.THAMDINH_BUCKET.delete(key);

    return new Response(JSON.stringify({ success: true, deleted: key }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

async function handleList(env: Env): Promise<Response> {
    const listed = await env.THAMDINH_BUCKET.list();

    const files = listed.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
    }));

    return new Response(JSON.stringify({ files }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}
