const express = require('express');
const multer = require('multer');
const ApkParser = require('node-apk-parser');
const fs = require('fs');
const cors = require('cors');
const os = require('os');
const path = require('path');

const app = express();

// 1. Enable CORS for your mobile app
app.use(cors());

// 2. Configure Multer to use /tmp (the only writable directory on Vercel)
const upload = multer({ dest: os.tmpdir() });

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

        // 3. Clean up the temp file immediately to save memory
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
            try { fs.unlinkSync(filePath); } catch (e) { console.error(e); }
        }
        res.status(500).json({ error: 'Failed to parse APK file' });
    }
});

// 4. IMPORTANT: Export the app for Vercel (Do NOT use app.listen)
module.exports = app;