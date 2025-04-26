const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Path to the data.json file
const dataFilePath = path.join(__dirname, '../data/data.json');

// Handle form submission
router.post('/submit', (req, res) => {
    const { email, phone, message } = req.body;

    // Read existing data
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data file:', err);
            return res.status(500).send('Server error');
        }

        const testimonials = data ? JSON.parse(data) : [];

        // Add new testimonial
        testimonials.push({
            email,
            phone,
            message,
            date: new Date().toISOString(),
        });

        // Write updated data back to the file
        fs.writeFile(dataFilePath, JSON.stringify(testimonials, null, 2), (err) => {
            if (err) {
                console.error('Error writing to data file:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/#testmonial'); // Redirect back to the testimonials section
        });
    });
});

module.exports = router;