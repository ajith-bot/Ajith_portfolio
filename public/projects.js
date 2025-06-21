// Global variables
let isAdminMode = false;
let projects = [];
let currentFilter = 'all';

// Load projects on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProjects();
    
    // Check for admin mode from localStorage
    if (localStorage.getItem('adminMode') === 'true') {
        enableAdminMode();
    }
});

// Load projects from API
async function loadProjects() {
    console.log('🔄 Loading projects from API...');
    
    try {
        const response = await fetch('/api/projects', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('📡 API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Get the response text first to debug
        const responseText = await response.text();
        console.log('📡 Raw API Response:', responseText);
        
        // Parse JSON
        let projects;
        try {
            projects = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            throw new Error('Invalid JSON response from server');
        }
        
        console.log('✅ Parsed projects:', projects);
        
        // Handle different response formats
        let projectsArray;
        if (Array.isArray(projects)) {
            projectsArray = projects;
        } else if (projects && projects.data && Array.isArray(projects.data)) {
            projectsArray = projects.data;
        } else if (projects && projects.projects && Array.isArray(projects.projects)) {
            projectsArray = projects.projects;
        } else if (projects && typeof projects === 'object') {
            // If it's a single project object, wrap in array
            projectsArray = [projects];
        } else {
            console.error('❌ Unexpected response format:', projects);
            projectsArray = [];
        }
        
        console.log('📊 Final projects array:', projectsArray);
        console.log('📊 Number of projects:', projectsArray.length);
        
        // Store globally
        window.projects = projectsArray;
        window.allProjects = projectsArray;
        
        // Display projects in both formats
        displayProjectsByCompany(projectsArray);
        displayAllProjectsGrid(projectsArray);
        
        return projectsArray;
        
    } catch (error) {
        console.error('❌ Failed to load projects:', error);
        showErrorMessage(error.message);
        return [];
    }
}

// Display projects by company in their respective sections
function displayProjectsByCompany(projectsArray = window.projects || []) {
    console.log('🏢 Displaying projects by company:', projectsArray);
    
    const currentProjects = projectsArray.filter(p => p.company === 'UMIYA GROUP');
    const saudiProjects = projectsArray.filter(p => p.company === 'TABUK STEEL COMPANY');
    const governmentProjects = projectsArray.filter(p => p.company === 'KSR Engineering Construction Pvt');
    
    displayProjectList('currentProjectsList', currentProjects);
    displayProjectList('saudiProjectsList', saudiProjects);
    displayProjectList('governmentProjectsList', governmentProjects);
}

// Display project list for specific company
function displayProjectList(containerId, projectList) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} not found`);
        return;
    }
    
    if (projectList.length === 0) {
        container.innerHTML = '<li class="empty-state-small">No projects available</li>';
        return;
    }
    
    container.innerHTML = '';
    projectList.forEach(project => {
        const projectItem = document.createElement('li');
        projectItem.innerHTML = `
            <div style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                ${project.image ? `<img src="${project.image}" alt="${project.title}" class="project-thumbnail" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 10px;">` : ''}
                <div style="flex: 1;">
                    <strong style="color: #08488d; cursor: pointer;" onclick="openProjectDetails('${project._id}')">
                        ${project.title}
                    </strong>
                    <br>
                    <small style="color: #666;">
                        📍 ${project.location} • 💰 ${project.value} • 🏗️ ${project.type}
                        <span class="status-badge status-${project.status}" style="margin-left: 8px; padding: 2px 6px; border-radius: 3px; font-size: 10px; text-transform: uppercase;">
                            ${project.status}
                        </span>
                    </small>
                </div>
                ${isAdminMode ? `
                    <div class="admin-buttons" style="margin-left: 10px;">
                        <button onclick="editProject('${project._id}')" class="btn-edit" title="Edit Project" style="margin-right: 5px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProject('${project._id}')" class="btn-delete" title="Delete Project">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        container.appendChild(projectItem);
    });
}

// Display all projects in grid format
function displayAllProjectsGrid(projectsArray = window.projects || []) {
    console.log('🎨 Displaying all projects in grid:', projectsArray);
    
    const projectsGrid = document.getElementById('allProjectsGrid');
    if (!projectsGrid) {
        console.error('❌ All projects grid container not found');
        return;
    }
    
    // Apply current filter
    let filteredProjects = projectsArray;
    if (currentFilter !== 'all') {
        filteredProjects = projectsArray.filter(project => {
            switch (currentFilter) {
                case 'ongoing':
                    return project.status === 'ongoing';
                case 'completed':
                    return project.status === 'completed';
                case 'commercial':
                    return project.type && project.type.toLowerCase().includes('commercial');
                case 'residential':
                    return project.type && project.type.toLowerCase().includes('residential');
                default:
                    return true;
            }
        });
    }
    
    // Clear existing content
    projectsGrid.innerHTML = '';
    
    // Handle empty projects
    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-folder-open" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h4>No projects found</h4>
                <p>No projects match the current filter criteria.</p>
            </div>
        `;
        return;
    }
    
    // Generate project cards
    filteredProjects.forEach((project, index) => {
        const projectCard = createProjectCard(project, index);
        projectsGrid.appendChild(projectCard);
    });
    
    console.log(`✅ Displayed ${filteredProjects.length} projects in grid`);
}

// Create project card element
function createProjectCard(project, index) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.style.animationDelay = `${index * 0.1}s`;
    card.setAttribute('data-project-id', project._id || '');
    
    // Safe property access with defaults
    const title = project.title || 'Untitled Project';
    const location = project.location || 'Location not specified';
    const value = project.value || 'Value not specified';
    const company = project.company || 'Company not specified';
    const type = project.type || 'Type not specified';
    const status = project.status || 'ongoing';
    const description = project.description || 'No description available';
    const image = project.image || '/Images/default-project.jpg';
    
    card.innerHTML = `
        <div class="project-status-badge status-${status}">
            ${status.toUpperCase()}
        </div>
        <img src="${image}" 
             alt="${title}" 
             class="project-card-image"
             onerror="this.src='/Images/default-project.jpg'"
             onclick="openProjectDetails('${project._id}')">
        <div class="project-card-content">
            <h4 class="project-card-title" onclick="openProjectDetails('${project._id}')">${title}</h4>
            <p class="project-card-details">
                <i class="fas fa-map-marker-alt"></i> ${location}
            </p>
            <p class="project-card-company">
                <i class="fas fa-building"></i> ${company}
            </p>
            <p class="project-card-value">
                <i class="fas fa-rupee-sign"></i> ${value}
            </p>
            <p class="project-card-type">
                <i class="fas fa-tag"></i> ${type}
            </p>
            <div class="project-card-status status-${status}">
                <i class="fas fa-${status === 'ongoing' ? 'play' : 'check'}"></i>
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
            ${isAdminMode ? `
                <div class="project-card-admin">
                    <button onclick="event.stopPropagation(); editProject('${project._id}')" 
                            class="btn-edit" title="Edit Project">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteProject('${project._id}')" 
                            class="btn-delete" title="Delete Project">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Filter projects
function filterProjects(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Re-display projects with new filter
    displayAllProjectsGrid();
}

// Search functionality
function handleSearch(searchTerm) {
    const clearBtn = document.getElementById('clearSearchBtn');
    if (searchTerm.trim()) {
        clearBtn.style.display = 'block';
        searchProjects(searchTerm);
    } else {
        clearBtn.style.display = 'none';
        displayAllProjectsGrid(); // Show all projects when search is empty
    }
}

function clearSearch() {
    document.getElementById('projectSearch').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    displayAllProjectsGrid();
}

function searchProjects(searchTerm) {
    const projectsArray = window.projects || [];
    const filteredProjects = projectsArray.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displayFilteredProjects(filteredProjects);
}

function displayFilteredProjects(filteredProjects) {
    const projectsGrid = document.getElementById('allProjectsGrid');
    if (!projectsGrid) return;
    
    projectsGrid.innerHTML = '';
    
    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h4>No projects found</h4>
                <p>Try adjusting your search terms.</p>
            </div>
        `;
        return;
    }
    
    filteredProjects.forEach((project, index) => {
        const projectCard = createProjectCard(project, index);
        projectsGrid.appendChild(projectCard);
    });
}

// Enable admin mode
function enableAdminMode() {
    isAdminMode = true;
    window.isAdminMode = true;
    const adminControls = document.getElementById('adminControls');
    if (adminControls) {
        adminControls.style.display = 'block';
    }
    
    // Refresh displays to show admin buttons
    displayProjectsByCompany();
    displayAllProjectsGrid();
    showSuccess('Admin mode enabled');
}

// Disable admin mode
function toggleAdminMode() {
    isAdminMode = false;
    window.isAdminMode = false;
    localStorage.removeItem('adminMode');
    const adminControls = document.getElementById('adminControls');
    if (adminControls) {
        adminControls.style.display = 'none';
    }
    
    // Refresh displays to hide admin buttons
    displayProjectsByCompany();
    displayAllProjectsGrid();
    showSuccess('Admin mode disabled');
}

// Show add project form
function showAddProjectForm() {
    document.getElementById('modalTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectModal').style.display = 'block';
}

// Edit project
async function editProject(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
            throw new Error('Failed to load project');
        }
        const project = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Edit Project';
        document.getElementById('projectId').value = project._id;
        document.getElementById('title').value = project.title || '';
        document.getElementById('company').value = project.company || '';
        document.getElementById('location').value = project.location || '';
        document.getElementById('value').value = project.value || '';
        document.getElementById('type').value = project.type || '';
        document.getElementById('description').value = project.description || '';
        document.getElementById('status').value = project.status || 'ongoing';
        
        document.getElementById('projectModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading project:', error);
        showError('Failed to load project details');
    }
}

// Delete project
async function deleteProject(projectId) {
    const projectsArray = window.projects || [];
    const project = projectsArray.find(p => p._id === projectId);
    const projectName = project ? project.title : 'this project';
    
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Project deleted successfully');
            loadProjects(); // Reload projects
        } else {
            const error = await response.json();
            showError('Error deleting project: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showError('Failed to delete project');
    }
}

// Open project details modal
async function openProjectDetails(projectId) {
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
            throw new Error('Failed to load project');
        }
        const project = await response.json();
        
        const detailsContent = document.getElementById('projectDetailsContent');
        detailsContent.innerHTML = `
            <div class="project-details-header">
                <img src="${project.image || '/Images/default-project.jpg'}" 
                     alt="${project.title}" 
                     class="project-details-image"
                     onerror="this.src='/Images/default-project.jpg'">
                <div class="project-details-info">
                    <h2>${project.title}</h2>
                    <p><i class="fas fa-building"></i> ${project.company}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${project.location}</p>
                    <span class="project-card-status status-${project.status}">
                        <i class="fas fa-${project.status === 'ongoing' ? 'play' : 'check'}"></i>
                        ${project.status.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div class="project-details-meta">
                <div class="meta-item">
                    <span class="meta-label">Project Value</span>
                    <span class="meta-value">${project.value}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Project Type</span>
                    <span class="meta-value">${project.type}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Status</span>
                    <span class="meta-value">${project.status}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created</span>
                    <span class="meta-value">${new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            
            <div class="project-description">
                <h4><i class="fas fa-info-circle"></i> Project Description</h4>
                <p>${project.description}</p>
            </div>
            
            ${isAdminMode ? `
                <div class="project-details-admin">
                    <button onclick="closeProjectDetailsModal(); editProject('${project._id}')" class="btn-primary">
                        <i class="fas fa-edit"></i> Edit Project
                    </button>
                    <button onclick="deleteProject('${project._id}')" class="btn-delete">
                        <i class="fas fa-trash"></i> Delete Project
                    </button>
                </div>
            ` : ''}
        `;
        
        document.getElementById('projectDetailsModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading project details:', error);
        showError('Failed to load project details');
    }
}

// Handle form submission
document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    const formData = new FormData(this);
    const projectId = document.getElementById('projectId').value;
    
    try {
        const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
        const method = projectId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (response.ok) {
            const message = projectId ? 'Project updated successfully' : 'Project added successfully';
            showSuccess(message);
            closeProjectModal();
            loadProjects(); // Reload projects
        } else {
            const error = await response.json();
            showError('Error: ' + error.message);
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showError('Failed to save project');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Modal functions
function closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
}

function closeProjectDetailsModal() {
    document.getElementById('projectDetailsModal').style.display = 'none';
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// Open image in modal
function openProjectImage(imageSrc, caption) {
    document.getElementById('modalImage').src = imageSrc;
    document.getElementById('modalCaption').textContent = caption;
    document.getElementById('imageModal').style.display = 'block';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const projectModal = document.getElementById('projectModal');
    const projectDetailsModal = document.getElementById('projectDetailsModal');
    const imageModal = document.getElementById('imageModal');
    
    if (event.target == projectModal) {
        projectModal.style.display = 'none';
    }
    if (event.target == projectDetailsModal) {
        projectDetailsModal.style.display = 'none';
    }
    if (event.target == imageModal) {
        imageModal.style.display = 'none';
    }
}

// Utility functions
function showLoading() {
    const loadingElement = document.getElementById('loadingProjects');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loadingProjects');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-error" style="
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
        ">×</button>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-success" style="
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            margin-left: auto;
        ">×</button>
    `;
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        closeProjectModal();
        closeProjectDetailsModal();
        closeImageModal();
    }
    
    // Ctrl + N to add new project (admin mode)
    if (e.ctrlKey && e.key === 'n' && isAdminMode) {
        e.preventDefault();
        showAddProjectForm();
    }
});

// Add comprehensive error handling
function showErrorMessage(message) {
    console.error('🚨 Showing error message:', message);
    
    // Show error in company sections
    const containers = ['currentProjectsList', 'saudiProjectsList', 'governmentProjectsList'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <li style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 5px; list-style: none; margin: 10px 0;">
                    <strong>⚠️ Error Loading Projects</strong><br>
                    <code>${message}</code><br>
                    <div style="margin-top: 10px;">
                        <button onclick="loadProjects()" style="background: #08488d; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-right: 10px;">🔄 Retry</button>
                        <button onclick="debugAPI()" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">🔍 Debug</button>
                    </div>
                </li>
            `;
        }
    });
    
    // Show error in grid view
    const projectsGrid = document.getElementById('allProjectsGrid');
    if (projectsGrid) {
        projectsGrid.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px; color: #c62828; background: #ffebee; border-radius: 8px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h4>Error Loading Projects</h4>
                <p><code>${message}</code></p>
                <div style="margin-top: 20px;">
                    <button onclick="loadProjects()" style="background: #08488d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        <i class="fas fa-redo"></i> Retry Loading
                    </button>
                    <button onclick="debugAPI()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-bug"></i> Debug API
                    </button>
                </div>
            </div>
        `;
    }
}

// Debug function
async function debugAPI() {
    console.log('🔍 Starting API Debug...');
    
    try {
        // Test basic connectivity
        console.log('1. Testing basic connectivity...');
        const healthResponse = await fetch('/api/health');
        console.log('Health check status:', healthResponse.status);
        
        // Test projects endpoint
        console.log('2. Testing projects endpoint...');
        const projectsResponse = await fetch('/api/projects');
        console.log('Projects response status:', projectsResponse.status);
        console.log('Projects response headers:', [...projectsResponse.headers.entries()]);
        
        // Get raw response
        const rawText = await projectsResponse.text();
        console.log('3. Raw response text:', rawText);
        
        // Try to parse
        try {
            const parsed = JSON.parse(rawText);
            console.log('4. Parsed JSON:', parsed);
            console.log('5. Type check:', typeof parsed, Array.isArray(parsed));
            
            if (Array.isArray(parsed)) {
                console.log('✅ Response is array with', parsed.length, 'items');
                parsed.forEach((item, index) => {
                    console.log(`Project ${index + 1}:`, item);
                });
            } else {
                console.log('⚠️ Response is not array:', parsed);
            }
            
        } catch (parseError) {
            console.error('❌ JSON parse failed:', parseError);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

// Export functions for global access
window.filterProjects = filterProjects;
window.showAddProjectForm = showAddProjectForm;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.openProjectDetails = openProjectDetails;
window.openProjectImage = openProjectImage;
window.closeProjectModal = closeProjectModal;
window.closeProjectDetailsModal = closeProjectDetailsModal;
window.closeImageModal = closeImageModal;
window.searchProjects = searchProjects;
window.handleSearch = handleSearch;
window.clearSearch = clearSearch;
window.loadProjects = loadProjects;
window.displayProjects = displayAllProjectsGrid; // Alias for backward compatibility
window.displayAllProjectsGrid = displayAllProjectsGrid;
window.displayProjectsByCompany = displayProjectsByCompany;
window.debugAPI = debugAPI;
window.showErrorMessage = showErrorMessage;
window.enableAdminMode = enableAdminMode;
window.toggleAdminMode = toggleAdminMode;