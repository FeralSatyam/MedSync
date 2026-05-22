const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Create a dummy image file
fs.writeFileSync('dummy.jpg', Buffer.from('test'));

const form = new FormData();
form.append('patientId', '123456789012345678901234');
form.append('name', 'Test');
form.append('strength', '10');
form.append('unit', 'mg');
form.append('frequencyPerDay', '1');
form.append('dosePerIntake', '1');
form.append('currentStock', '10');
form.append('medicinePhoto', fs.createReadStream('dummy.jpg'));

axios.post('http://localhost:5000/api/medicines', form, {
  headers: {
    ...form.getHeaders()
  }
}).then(res => {
  console.log('Success:', res.data);
}).catch(err => {
  console.log('Error:', err.response ? err.response.data : err.message);
});
