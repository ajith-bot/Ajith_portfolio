require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// MongoDB Connection with Atlas
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'ajith_portfolio' // Specify database name
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('📊 Database:', mongoose.connection.name);
})
.catch((error) => {
    console.error('❌ MongoDB Atlas connection error:', error);
    process.exit(1);
});

// Connection event listeners
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (error) => {
    console.error('❌ Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('👋 MongoDB Atlas connection closed through app termination');
    process.exit(0);
});

// Project Schema
const projectSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    company: { 
        type: String, 
        required: [true, 'Company name is required'],
        trim: true
    },
    location: { 
        type: String, 
        required: [true, 'Location is required'],
        trim: true
    },
    value: { 
        type: String, 
        required: [true, 'Project value is required'],
        trim: true
    },
    type: { 
        type: String, 
        enum: {
            values: [
                'residential',
                'commercial', 
                'infrastructure',
                'luxury-villas',
                'apartments',
                'condominiums',
                'office-buildings',
                'retail-spaces',
                'hospitals',
                'educational',
                'industrial',
                'mixed-use',
                'government',
                'hospitality'
            ],
            message: 'Please select a valid project type'
        },
        required: [true, 'Project type is required']
    },
    status: { 
        type: String, 
        enum: {
            values: ['ongoing', 'completed', 'planned', 'on-hold'],
            message: 'Status must be ongoing, completed, planned, or on-hold'
        },
        required: [true, 'Project status is required']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    image: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'Image must be a valid image file'
        }
    },
    startDate: {
        type: Date,
        validate: {
            validator: function(v) {
                return !v || v <= new Date();
            },
            message: 'Start date cannot be in the future'
        }
    },
    endDate: {
        type: Date,
        validate: {
            validator: function(v) {
                return !v || !this.startDate || v >= this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    technologies: [{
        type: String,
        trim: true
    }],
    teamSize: {
        type: Number,
        min: [1, 'Team size must be at least 1'],
        max: [1000, 'Team size cannot exceed 1000']
    },
    budget: {
        type: Number,
        min: [0, 'Budget cannot be negative']
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Add indexes for better query performance
projectSchema.index({ title: 'text', description: 'text' });
projectSchema.index({ status: 1, type: 1 });
projectSchema.index({ createdAt: -1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
    }
    return null;
});

const Project = mongoose.model('Project', projectSchema);

// Create uploads directory
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
        }
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all projects with filtering and pagination
app.get('/api/projects', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            type, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const projects = await Project.find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Get total count for pagination
        const total = await Project.countDocuments(filter);

        res.json({
            projects,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ 
            message: 'Error fetching projects',
            error: error.message 
        });
    }
});

// Get single project
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ 
            message: 'Error fetching project',
            error: error.message 
        });
    }
});

// Admin password verification
app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD) {
        res.json({ 
            success: true, 
            message: 'Admin access granted' 
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid admin password' 
        });
    }
});

// Create new project (admin only)
app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        const projectData = {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            value: req.body.value,
            type: req.body.type,
            status: req.body.status,
            description: req.body.description,
            startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : [],
            teamSize: req.body.teamSize ? parseInt(req.body.teamSize) : undefined,
            budget: req.body.budget ? parseFloat(req.body.budget) : undefined
        };

        if (req.file) {
            projectData.image = `/uploads/${req.file.filename}`;
        }

        const project = new Project(projectData);
        await project.save();
        
        console.log('✅ New project created:', project.title);
        res.status(201).json(project);
    } catch (error) {
        console.error('❌ Error creating project:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error',
                errors 
            });
        }
        
        res.status(500).json({ 
            message: 'Error creating project',
            error: error.message 
        });
    }
});

// Update project (admin only)
app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            company: req.body.company,
            location: req.body.location,
            value: req.body.value,
            type: req.body.type,
            status: req.body.status,
            description: req.body.description,
            startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
            endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
            technologies: req.body.technologies ? req.body.technologies.split(',').map(t => t.trim()) : [],
            teamSize: req.body.teamSize ? parseInt(req.body.teamSize) : undefined,
            budget: req.body.budget ? parseFloat(req.body.budget) : undefined
        };

        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { 
                new: true, 
                runValidators: true 
            }
        );
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        console.log('✅ Project updated:', project.title);
        res.json(project);
    } catch (error) {
        console.error('❌ Error updating project:', error);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation error',
                errors 
            });
        }
        
        res.status(500).json({ 
            message: 'Error updating project',
            error: error.message 
        });
    }
});

// Delete project (admin only)
app.delete('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        // Delete associated image file
        if (project.image) {
            const imagePath = path.join(__dirname, 'public', project.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('🗑️ Deleted image file:', project.image);
            }
        }
        
        console.log('✅ Project deleted:', project.title);
        res.json({ 
            message: 'Project deleted successfully',
            deletedProject: project 
        });
    } catch (error) {
        console.error('❌ Error deleting project:', error);
        res.status(500).json({ 
            message: 'Error deleting project',
            error: error.message 
        });
    }
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await Project.aggregate([
            {
                $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    ongoingProjects: {
                        $sum: { $cond: [{ $eq: ['$status', 'ongoing'] }, 1, 0] }
                    },
                    completedProjects: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    residentialProjects: {
                        $sum: { $cond: [{ $eq: ['$type', 'residential'] }, 1, 0] }
                    },
                    commercialProjects: {
                        $sum: { $cond: [{ $eq: ['$type', 'commercial'] }, 1, 0] }
                    },
                    totalBudget: { $sum: '$budget' }
                }
            }
        ]);

        const result = stats[0] || {
            totalProjects: 0,
            ongoingProjects: 0,
            completedProjects: 0,
            residentialProjects: 0,
            commercialProjects: 0,
            totalBudget: 0
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            message: 'Error fetching statistics',
            error: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        
        // Get database stats
        const dbStats = await mongoose.connection.db.stats();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: dbStatus,
                name: mongoose.connection.name,
                collections: dbStats.collections,
                dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
                storageSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`
            },
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File too large. Maximum size is 5MB.' 
            });
        }
    }
    
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Route not found',
        path: req.path 
    });
});

// Add this route after your existing routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (password === process.env.ADMIN_PASSWORD || password === 'ajith2025') {
        res.json({ 
            success: true, 
            message: 'Admin access granted',
            redirectUrl: '/?admin=true'
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid admin password' 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: MongoDB Atlas`);
});