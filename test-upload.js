const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Create a test file
const testContent = 'This is a test document content';
fs.writeFileSync('test-document.txt', testContent);

// Create FormData
const formData = new FormData();
formData.append('document', fs.createReadStream('test-document.txt'));
formData.append('type', 'AADHAR');
formData.append('description', 'Test upload');

// Send request
axios.post('http://localhost:3001/api/documents/upload', formData, {
  headers: {
    ...formData.getHeaders()
  }
}).then(response => {
  console.log('Success:', response.data);
}).catch(error => {
  console.log('Error:', error.response?.data || error.message);
}).finally(() => {
  // Clean up test file
  fs.unlinkSync('test-document.txt');
});
