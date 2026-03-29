const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Path to our shared JSON file (Our "local database" on the server)
const DATA_FILE = path.join(__dirname, 'applications.json');

// Helper to read data from the file
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(content || '[]');
    } catch (error) {
        console.error('Error reading data file:', error);
        return [];
    }
}

// Helper to write data to the file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to data file:', error);
        return false;
    }
}

// API: Submit application (Saves to server file)
app.post('/api/apply', async (req, res) => {
    const { fullName, age, discordId, jobType, reason, appCode } = req.body;
    
    if (!fullName || !discordId || !appCode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const applications = readData();
    const newApp = {
        id: Date.now(),
        fullName,
        age: parseInt(age),
        discordId,
        jobType,
        reason,
        appCode,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    applications.unshift(newApp); // Add to the beginning of the list
    
    if (writeData(applications)) {
        console.log(`✅ Application saved to server file: ${appCode}`);
        res.json({ success: true, id: newApp.id });
    } else {
        res.status(500).json({ error: 'Failed to save application to file' });
    }
});

// API: Get all applications (Shared for everyone/all admins)
app.get('/api/applications', (req, res) => {
    const applications = readData();
    res.json(applications);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Shared Server (Without Database) running on http://localhost:${PORT}`);
    console.log(`📁 Saving all applications to: ${DATA_FILE}`);
});
