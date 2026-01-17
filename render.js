const express = require('express');
const multer = require('multer');
const ApkParser = require('node-apk-parser');
const fs = require('fs');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());

// Render allows writing to temp folders, os.tmpdir() is still the best practice
const upload = multer({ dest: os.tmpdir() });

// Test route
app.get('/', (req, res) => {
  res.send('APK Parser Backend is Running on Render!');
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

// --- CHANGE THIS PART FOR RENDER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// You can keep this, but app.listen is what Render uses
module.exports = app;