export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    // 代理 GitHub 私有仓库图片
    if (path.startsWith('/api/photo/') && request.method === 'GET') {
      const filePath = path.replace('/api/photo/', 'photos/');
      const githubUrl = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${filePath}`;

      const response = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Cloudflare-Worker'
        }
      });

      if (!response.ok) {
        return new Response('Not Found', { status: 404 });
      }

      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(response.body, { headers });
    }

    // 上传照片到 GitHub 仓库根目录
    if (path === '/api/upload' && request.method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const filename = file.name;
      const apiUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${filename}`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare-Worker'
        },
        body: JSON.stringify({
          message: `Upload ${filename}`,
          content: base64,
          branch: env.GITHUB_BRANCH
        })
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Upload failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      return new Response(JSON.stringify({ success: true, filename }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};