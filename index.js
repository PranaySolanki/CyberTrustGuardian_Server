const express = require('express');
const multer = require('multer');
const ApkParser = require('node-apk-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('apk'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;

  try {
    const reader = ApkParser.readFile(filePath);
    const manifest = reader.readManifestSync();
    
    // Normalize permissions to be an array of strings
    let permissions = manifest.usesPermissions || [];
    if (permissions.length > 0 && typeof permissions[0] === 'object') {
        permissions = permissions.map(p => p.name);
    }

    const packageName = manifest.package || 'Unknown Package';

    // Clean up
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    res.json({ 
        package_name: packageName,
        permissions: permissions 
    });
  } catch (error) {
    console.error('Error parsing APK:', error);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) { console.error('Error deleting file:', e); }
    }
    // Send JSON error instead of text
    res.status(500).json({ error: 'Failed to parse APK file' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`APK Backend listening at http://0.0.0.0:${port}`);
});
const { playintegrity } = require('@googleapis/playintegrity');

async function verifyIntegrityToken(token) {
  const integrity = playintegrity('v1');
  const response = await integrity.gateways.decodeIntegrityToken({
    requestBody: { integrityToken: token }
  });

  // Google returns 'MEETS_DEVICE_INTEGRITY' if the hardware is genuine.
  const verdict = response.data.deviceIntegrity.deviceRecognitionVerdict;
  return verdict.includes('MEETS_DEVICE_INTEGRITY');
}