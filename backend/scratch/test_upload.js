const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testUpload() {
  const filePath = path.join(__dirname, '../../node_modules/pdf-parse/test/data/01-valid.pdf');
  if (!fs.existsSync(filePath)) {
    console.error('Test PDF not found at:', filePath);
    return;
  }

  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('clerkId', 'user_test_guest');

  try {
    console.log('Sending request to http://localhost:5000/api/analyze ...');
    const response = await axios.post('http://localhost:5000/api/analyze', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUpload();
