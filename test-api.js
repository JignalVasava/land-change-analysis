import http from 'http';

http.get('http://localhost:5002/classify?year=2022', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (err) => console.error('Error:', err.message));

setTimeout(() => process.exit(0), 35000);
