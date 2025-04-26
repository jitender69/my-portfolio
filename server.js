import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import fs from 'fs';
import contactRoute from './routes/contact.js';

const port = process.env.PORT || 3000;
const app = express();
const server = createServer(app);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware to log visitor information
app.use((req, res, next) => {
    const visitorInfo = {
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
    };

    // Log visitor info to a file
    const logFilePath = path.join(__dirname, 'logs', 'visitors.json');
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        let logs = [];
        if (!err && data) {
            try {
                logs = JSON.parse(data); // Parse existing logs
            } catch (parseError) {
                console.error('Invalid JSON in visitors.json. Resetting file.');
            }
        }

        logs.push(visitorInfo); // Add new visitor info

        fs.writeFile(logFilePath, JSON.stringify(logs, null, 2), (err) => {
            if (err) console.error('Error writing visitor log:', err);
        });
    });

    next();
});

// Routes
app.use('/contact', contactRoute);

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    const testimonialsPath = path.join(__dirname, 'data', 'data.json');
    const blogsPath = path.join(__dirname, 'data', 'blogs.json');
    const portfolioPath = path.join(__dirname, 'data', 'portfolio.json');

    // Read testimonials, blogs, and portfolio data
    fs.readFile(testimonialsPath, 'utf8', (err, testimonialsData) => {
        if (err) {
            console.error('Error reading testimonials:', err);
            return res.status(500).send('Server error');
        }

        fs.readFile(blogsPath, 'utf8', (err, blogsData) => {
            if (err) {
                console.error('Error reading blogs:', err);
                return res.status(500).send('Server error');
            }

            fs.readFile(portfolioPath, 'utf8', (err, portfolioData) => {
                if (err) {
                    console.error('Error reading portfolio:', err);
                    return res.status(500).send('Server error');
                }

                const testimonials = JSON.parse(testimonialsData || '[]');
                const blogs = JSON.parse(blogsData || '[]');
                const portfolio = JSON.parse(portfolioData || '[]');

                res.render('home', { title: 'My Portfolio', testimonials, blogs, portfolio });
            });
        });
    });
});

app.get('/components', (req, res) => {
    res.render('components', { title: 'My Portfolio' });
});

app.get('/admin/visitors', (req, res) => {
    const logFilePath = path.join(__dirname, 'logs', 'visitors.json');
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        let logs = [];
        if (!err && data) {
            try {
                logs = JSON.parse(data); // Parse visitor logs
            } catch (parseError) {
                console.error('Invalid JSON in visitors.json. Resetting file.');
                fs.writeFileSync(logFilePath, JSON.stringify([], null, 2)); // Reset file
            }
        }

        res.render('visitors', { logs }); // Pass logs to EJS
    });
});

app.get('/admin', (req, res) => {
    const portfolioPath = path.join(__dirname, 'data', 'portfolio.json');
    const blogsPath = path.join(__dirname, 'data', 'blogs.json');

    // Read portfolio and blogs data
    fs.readFile(portfolioPath, 'utf8', (err, portfolioData) => {
        if (err) {
            console.error('Error reading portfolio:', err);
            return res.status(500).send('Server error');
        }

        fs.readFile(blogsPath, 'utf8', (err, blogsData) => {
            if (err) {
                console.error('Error reading blogs:', err);
                return res.status(500).send('Server error');
            }

            const portfolio = JSON.parse(portfolioData || '[]');
            const blogs = JSON.parse(blogsData || '[]');

            res.render('admin', { portfolio, blogs });
        });
    });
});

// Handle delete requests for portfolio
app.post('/admin/portfolio/delete', (req, res) => {
    const portfolioPath = path.join(__dirname, 'data', 'portfolio.json');
    const { index } = req.body;

    fs.readFile(portfolioPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading portfolio:', err);
            return res.status(500).send('Server error');
        }

        const portfolio = JSON.parse(data || '[]');
        portfolio.splice(index, 1); // Remove the item at the specified index

        fs.writeFile(portfolioPath, JSON.stringify(portfolio, null, 2), (err) => {
            if (err) {
                console.error('Error writing portfolio:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/admin');
        });
    });
});

// Handle delete requests for blogs
app.post('/admin/blogs/delete', (req, res) => {
    const blogsPath = path.join(__dirname, 'data', 'blogs.json');
    const { index } = req.body;

    fs.readFile(blogsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading blogs:', err);
            return res.status(500).send('Server error');
        }

        const blogs = JSON.parse(data || '[]');
        blogs.splice(index, 1); // Remove the item at the specified index

        fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2), (err) => {
            if (err) {
                console.error('Error writing blogs:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/admin');
        });
    });
});

// Handle edit requests for portfolio
app.post('/admin/portfolio/edit', (req, res) => {
    const portfolioPath = path.join(__dirname, 'data', 'portfolio.json');
    const { index, title, description } = req.body;

    fs.readFile(portfolioPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading portfolio:', err);
            return res.status(500).send('Server error');
        }

        const portfolio = JSON.parse(data || '[]');
        portfolio[index].title = title;
        portfolio[index].description = description;

        fs.writeFile(portfolioPath, JSON.stringify(portfolio, null, 2), (err) => {
            if (err) {
                console.error('Error writing portfolio:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/admin');
        });
    });
});

// Handle edit requests for blogs
app.post('/admin/blogs/edit', (req, res) => {
    const blogsPath = path.join(__dirname, 'data', 'blogs.json');
    const { index, title, description } = req.body;

    fs.readFile(blogsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading blogs:', err);
            return res.status(500).send('Server error');
        }

        const blogs = JSON.parse(data || '[]');
        blogs[index].title = title;
        blogs[index].description = description;

        fs.writeFile(blogsPath, JSON.stringify(blogs, null, 2), (err) => {
            if (err) {
                console.error('Error writing blogs:', err);
                return res.status(500).send('Server error');
            }

            res.redirect('/admin');
        });
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

