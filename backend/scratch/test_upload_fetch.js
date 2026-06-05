const fs = require('fs');
const path = require('path');

async function testUpload() {
  const filePath = path.join(__dirname, '../../node_modules/pdf-parse/test/data/01-valid.pdf');
  if (!fs.existsSync(filePath)) {
    console.error('Test PDF not found at:', filePath);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('file', blob, '01-valid.pdf');
  formData.append('clerkId', 'user_test_guest');

  try {
    console.log('Sending request to http://localhost:5000/api/analyze ...');
    const response = await fetch('http://localhost:5000/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    console.log('Response Status:', response.status);
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUpload();
