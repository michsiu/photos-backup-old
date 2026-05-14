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

    // API: 获取 photos.json（从 GitHub 实时拉取，缓存 60 秒）
    if (path === '/photos.json' && request.method === 'GET') {
      const githubUrl = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/photos.json`;
      const response = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Cloudflare-Worker'
        }
      });
      if (!response.ok) return new Response('Not Found', { status: 404 });
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'application/json; charset=utf-8');
      headers.set('Cache-Control', 'public, max-age=60');
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, { headers });
    }

    // API: 代理图片
    if ((path.startsWith('/api/photo/') || path.startsWith('/photos/')) && request.method === 'GET') {
      let filePath = path;
      if (path.startsWith('/api/photo/')) {
        filePath = path.replace('/api/photo/', 'photos/');
      }
      const githubUrl = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${filePath}`;
      const response = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${env.GITHUB_TOKEN}`,
          'User-Agent': 'Cloudflare-Worker'
        }
      });
      if (!response.ok) return new Response('Not Found', { status: 404 });
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000');
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, { headers });
    }

    // API: 上传照片
    if (path === '/api/upload' && request.method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
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
        body: JSON.stringify({ message: `Upload ${filename}`, content: base64, branch: env.GITHUB_BRANCH })
      });
      if (!response.ok) return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      return new Response(JSON.stringify({ success: true, filename }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // 其他所有请求交给 Assets 处理（index.html、upload.html、thumbs/）
    return env.ASSETS.fetch(request);
  }
};