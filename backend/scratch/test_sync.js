fetch('http://localhost:5000/api/users/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ authId: 'test1234', email: 'test@test.com', name: 'Test User' })
}).then(r => r.json().then(data => console.log(r.status, data))).catch(console.error);
