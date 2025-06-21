const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ajith_portfolio', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
console.log('Connected to MongoDB');
});

// Project Schema
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  value: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
      if (file.mimetype.startsWith('image/')) {
          cb(null, true);
      } else {
          cb(new Error('Only image files are allowed!'), false);
      }
  }
});

// API Routes
app.get('/api/projects', async (req, res) => {
  try {
      const projects = await Project.find().sort({ createdAt: -1 });
      res.json(projects);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
      const project = await Project.findById(req.params.id);
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

app.post('/api/projects', upload.single('image'), async (req, res) => {
  try {
      const projectData = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          value: req.body.value,
          type: req.body.type,
          description: req.body.description,
          status: req.body.status || 'ongoing'
      };

      if (req.file) {
          projectData.image = '/uploads/' + req.file.filename;
      }

      const project = new Project(projectData);
      const savedProject = await project.save();
      res.status(201).json(savedProject);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
  try {
      const updateData = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          value: req.body.value,
          type: req.body.type,
          description: req.body.description,
          status: req.body.status,
          updatedAt: new Date()
      };

      if (req.file) {
          updateData.image = '/uploads/' + req.file.filename;
      }

      const project = await Project.findByIdAndUpdate(
          req.params.id, 
          updateData, 
          { new: true }
      );
        
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }
        
      res.json(project);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
      const project = await Project.findByIdAndDelete(req.params.id);
      if (!project) {
          return res.status(404).json({ message: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large' });
      }
  }
  res.status(500).json({ message: error.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});