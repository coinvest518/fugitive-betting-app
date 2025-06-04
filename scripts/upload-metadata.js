const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PINATA_JWT = process.env.PINATA_JWT;
const metadataDir = path.join(__dirname, '../public/metadata');

async function uploadFile(filePath) {
  const data = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);
  const formData = new (require('form-data'))();
  formData.append('file', data, fileName);

  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${PINATA_JWT}`,
      },
    }
  );
  return res.data;
}

async function main() {
  const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(metadataDir, file);
    try {
      const result = await uploadFile(filePath);
      console.log(`${file}:`, result.IpfsHash);
    } catch (e) {
      console.error(`${file}: Upload failed`, e.message);
    }
  }
}

main();
