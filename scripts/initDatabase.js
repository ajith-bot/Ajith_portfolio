require('dotenv').config();
const mongoose = require('mongoose');

// Sample project data
const sampleProjects = [
    {
        title: "Umiya Vellociti",
        company: "UMIYA GROUP",
        location: "Bangalore",
        value: "₹170 Cr",
        type: "commercial",
        status: "ongoing",
        description: "High-rise commercial building with modern amenities and sustainable design features.",
        startDate: new Date('2023-10-01'),
        technologies: ["AutoCAD", "Revit", "Staad Pro"],
        teamSize: 25,
        budget: 1700000000
    },
    {
        title: "Umiya Water Colours-2 Villas",
        company: "UMIYA GROUP",
        location: "Sangolda, Goa",
        value: "₹10 Cr",
        type: "residential",
        status: "ongoing",
        description: "Luxury villas with premium finishes and scenic views.",
        startDate: new Date('2023-11-01'),
        technologies: ["AutoCAD", "SketchUp"],
        teamSize: 15,
        budget: 100000000
    },
    {
        title: "Palms by Umiya",
        company: "UMIYA GROUP",
        location: "Candolim, Goa",
        value: "₹15 Cr",
        type: "residential",
        status: "completed",
        description: "G+4 apartment complex with modern amenities.",
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        technologies: ["AutoCAD", "Revit"],
        teamSize: 20,
        budget: 150000000
    }
];

// Project Schema (same as in server.js)
const projectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    type: { 
        type: String, 
        enum: ['residential', 'commercial', 'infrastructure'],
        required: true 
    },
    status: { 
        type: String, 
        enum: ['ongoing', 'completed', 'planned'],
        required: true 
    },
    description: String,
    image: String,
    startDate: Date,
    endDate: Date,
    technologies: [String],
    teamSize: Number,
    budget: Number
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB Atlas');
        
        // Clear existing projects
        await Project.deleteMany({});
        console.log('🗑️ Cleared existing projects');
        
        // Insert sample projects
        const insertedProjects = await Project.insertMany(sampleProjects);
        console.log(`✅ Inserted ${insertedProjects.length} sample projects`);
        
        // Display inserted projects
        console.log('\n📋 Sample Projects Added:');
        insertedProjects.forEach((project, index) => {
            console.log(`${index + 1}. ${project.title} - ${project.status}`);
        });
        
        console.log('\n🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

// Run initialization
initializeDatabase();