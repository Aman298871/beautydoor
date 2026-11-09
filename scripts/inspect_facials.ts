import http from 'http';

function getAdminToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username: 'admin', password: 'Admin@BeautyDoor2026' });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.token);
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getServices(token: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/services',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        resolve(json.services || []);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const token = await getAdminToken();
  const services = await getServices(token);
  const facials = services.filter((s: any) => s.category_id === 'cat-facials');
  console.log(`Total Facials in Database: ${facials.length}\n`);

  for (const f of facials) {
    let steps: string[] = [];
    try {
      steps = JSON.parse(f.steps_json || '[]');
    } catch (e) {
      steps = [];
    }
    console.log({
      id: f.id,
      name: f.name,
      brand: f.brand,
      duration_mins: f.duration_mins,
      selling_price: f.selling_price,
      steps_count: f.steps_count,
      stored_steps_length: steps.length,
      stored_steps: steps,
      is_published: f.is_published
    });
  }
}

main().catch(console.error);
