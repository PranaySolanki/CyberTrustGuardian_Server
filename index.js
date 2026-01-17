const express = require('express');
const multer = require('multer');
const ApkParser = require('node-apk-parser');
const fs = require('fs');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());

// Vercel filesystem is read-only; os.tmpdir() is the only place we can write
const upload = multer({ dest: os.tmpdir() });

// Add a test route so you can verify the deployment is working
app.get('/', (req, res) => {
  res.send('APK Parser Backend is Running!');
});

app.post('/upload', upload.single('apk'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filePath = req.file.path;

  try {
    const reader = ApkParser.readFile(filePath);
    const manifest = reader.readManifestSync();
    
    let permissions = manifest.usesPermissions || [];
    if (permissions.length > 0 && typeof permissions[0] === 'object') {
        permissions = permissions.map(p => p.name);
    }

    const packageName = manifest.package || 'Unknown Package';

    // Clean up temporary file immediately
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
    res.status(500).json({ error: 'Failed to parse APK file' });
  }
});

// Export for Vercel serverless execution
module.exports = app;