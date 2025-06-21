// Global variables
let isAdminMode = false;
let projects = [];
let currentFilter = 'all';

// Load projects on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProjects();
});

// Load projects from API
async function loadProjects() {
    showLoading();
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
            throw new Error('Failed to load projects');
        }
        projects = await response.json();
        displayProjects();
        displayProjectsByCompany();
        hideLoading();
    } catch (error) {
        console.error('Error loading projects:', error);
        showError('Failed to load projects. Please try again later.');
        hideLoading();
    }
}

// Display projects in different sections
function displayProjectsByCompany() {
    const currentProjects = projects.filter(p => p.company === 'UMIYA GROUP');
    const saudiProjects = projects.filter(p => p.company === 'TABUK STEEL COMPANY');
    const governmentProjects = projects.filter(p => p.company === 'KSR Engineering Construction Pvt');
    
    displayProjectList('currentProjectsList', currentProjects);
    displayProjectList('saudiProjectsList', saudiProjects);
    displayProjectList('governmentProjectsList', governmentProjects);
}

// Display project list for specific company
function displayProjectList(containerId, projectList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (projectList.length === 0) {
        container.innerHTML = '<li class="empty-state-small">No projects available</li>';
        return;
    }
    
    container.innerHTML = '';
    projectList.forEach(project => {
        const projectItem = document.createElement('li');
        projectItem.innerHTML = `
            ✓ <a href="#" class="project-link" onclick="openProjectDetails('${project._id}')">
                <img src="${project.image || '/Images/default-project.jpg'}" alt="${project.title}" class="project-thumbnail">
                ${project.title} (${project.location}) - ${project.value} ${project.type}
            </a>
            ${isAdminMode ? `
                <div class="admin-buttons">
                    <button onclick="editProject('${project._id}')" class="btn-edit" title="Edit Project">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProject('${project._id}')" class="btn-delete" title="Delete Project">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            ` : ''}
        `;
        container.appendChild(projectItem);
    });
}

// Display all projects in grid format
function displayProjects() {
    const projectsGrid = document.getElementById('allProjectsGrid');
    if (!projectsGrid) return;
    
    let filteredProjects = projects;
    
    // Apply filters
    if (currentFilter !== 'all') {
        filteredProjects = projects.filter(project => {
            switch (currentFilter) {
                case 'ongoing':
                    return project.status === 'ongoing';
                case 'completed':
                    return project.status === 'completed';
                case 'commercial':
                    return project.type.toLowerCase().includes('commercial') || 
                           project.type.toLowerCase().includes('building');
                case 'residential':
                    return project.type.toLowerCase().includes('villa') || 
                           project.type.toLowerCase().includes('apartment') || 
                           project.type.toLowerCase().includes('residential');
                default:
                    return true;
            }
        });
    }
    
    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h4>No projects found</h4>
                <p>No projects match the current filter criteria.</p>
            </div>
        `;
        return;
    }
    
    projectsGrid.innerHTML = '';
    filteredProjects.forEach((project, index) => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.style.animationDelay = `${index * 0.1}s`;
        projectCard.onclick = () => openProjectDetails(project._id);
        
        projectCard.innerHTML = `
            <div class="project-status-badge status-${project.status}">
                ${project.status}
            </div>
            <img src="${project.image || '/Images/default-project.jpg'}" 
                 alt="${project.title}" 
                 class="project-card-image"
                 onerror="this.src='/Images/default-project.jpg'">
            <div class="project-card-content">
                <h4 class="project-card-title">${project.title}</h4>
                <p class="project-card-details">
                    <i class="fas fa-map-marker-alt"></i> ${project.location} | 
                    <i class="fas fa-building"></i> ${project.company}
                </p>
                <p class="project-card-value">
                    <i class="fas fa-rupee-sign"></i> ${project.value}
                </p>
                <span class="project-card-status status-${project.status}">
                    <i class="fas fa-${project.status === 'ongoing' ? 'play' : 'check'}"></i>
                    ${project.status}
                </span>
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
        projectsGrid.appendChild(projectCard);
    });
}

// Filter projects
function filterProjects(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    displayProjects();
}

// Enable admin mode
function enableAdminMode() {
    isAdminMode = true;
    document.getElementById('adminControls').style.display = 'block';
    displayProjects();
    displayProjectsByCompany();
    showSuccess('Admin mode enabled');
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
        document.getElementById('title').value = project.title;
        document.getElementById('company').value = project.company;
        document.getElementById('location').value = project.location;
        document.getElementById('value').value = project.value;
        document.getElementById('type').value = project.type;
        document.getElementById('description').value = project.description;
        document.getElementById('status').value = project.status;
        
        document.getElementById('projectModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading project:', error);
        showError('Failed to load project details');
    }
}

// Delete project
async function deleteProject(projectId) {
    const project = projects.find(p => p._id === projectId);
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
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-error">×</button>
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
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="close-success">×</button>
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

// Search functionality
function searchProjects(searchTerm) {
    const filteredProjects = projects.filter(project => 
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displayFilteredProjects(filteredProjects);
}

function displayFilteredProjects(filteredProjects) {
    const projectsGrid = document.getElementById('allProjectsGrid');
    if (!projectsGrid) return;
    
    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h4>No projects found</h4>
                <p>Try adjusting your search terms.</p>
            </div>
        `;
        return;
    }
    
    projectsGrid.innerHTML = '';
    filteredProjects.forEach((project, index) => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.style.animationDelay = `${index * 0.1}s`;
        projectCard.onclick = () => openProjectDetails(project._id);
        
        projectCard.innerHTML = `
            <div class="project-status-badge status-${project.status}">
                ${project.status}
            </div>
            <img src="${project.image || '/Images/default-project.jpg'}" 
                 alt="${project.title}" 
                 class="project-card-image"
                 onerror="this.src='/Images/default-project.jpg'">
            <div class="project-card-content">
                <h4 class="project-card-title">${project.title}</h4>
                <p class="project-card-details">
                    <i class="fas fa-map-marker-alt"></i> ${project.location} | 
                    <i class="fas fa-building"></i> ${project.company}
                </p>
                <p class="project-card-value">
                    <i class="fas fa-rupee-sign"></i> ${project.value}
                </p>
                <span class="project-card-status status-${project.status}">
                    <i class="fas fa-${project.status === 'ongoing' ? 'play' : 'check'}"></i>
                    ${project.status}
                </span>
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
        projectsGrid.appendChild(projectCard);
    });
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