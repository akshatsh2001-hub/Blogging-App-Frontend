// ==========================================
// Configuration & DOM Elements
// ==========================================
//const API_URL = 'http://localhost:5000'; // Connect to your Express backend

const API_URL = 'https://blogging-app-backend-cwic.onrender.com';

// Navigation
const navHome = document.getElementById('nav-home');
const navAuth = document.getElementById('nav-auth');
const navDashboard = document.getElementById('nav-dashboard');
const navLogout = document.getElementById('nav-logout');

// Sections
const publicSection = document.getElementById('public-feed-section');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');

// Auth Elements
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuthLink = document.getElementById('toggle-auth-link');
const toggleAuthText = document.getElementById('toggle-auth-text');
const authMessage = document.getElementById('auth-message');

// Dashboard Elements
const userDisplay = document.getElementById('user-display');
const showEditorBtn = document.getElementById('show-editor-btn');
const postEditor = document.getElementById('post-editor');
const postForm = document.getElementById('post-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editorTitle = document.getElementById('editor-title');

// Containers
const publicPostsContainer = document.getElementById('public-posts-container');
const userPostsContainer = document.getElementById('user-posts-container');

// ==========================================
// Application State
// ==========================================
let token = localStorage.getItem('blogApp_token');
let currentUser = localStorage.getItem('blogApp_user');
let isLoginMode = true;
let posts = [];

// Initialize App
updateNav();
showSection(currentUser ? 'dashboard' : 'home');

// ==========================================
// Navigation Logic
// ==========================================
function updateNav() {
    if (currentUser) {
        navAuth.classList.add('hidden');
        navDashboard.classList.remove('hidden');
        navLogout.classList.remove('hidden');
        userDisplay.innerText = currentUser;
    } else {
        navAuth.classList.remove('hidden');
        navDashboard.classList.add('hidden');
        navLogout.classList.add('hidden');
    }
}

function showSection(section) {
    publicSection.classList.add('hidden');
    authSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');

    if (section === 'home') {
        publicSection.classList.remove('hidden');
        fetchPosts(); // Fetch from DB when viewing home
    } else if (section === 'auth') {
        authSection.classList.remove('hidden');
    } else if (section === 'dashboard') {
        dashboardSection.classList.remove('hidden');
        postEditor.classList.add('hidden');
        fetchPosts(); // Fetch from DB when viewing dashboard
    }
}

navHome.addEventListener('click', () => showSection('home'));
navAuth.addEventListener('click', () => showSection('auth'));
navDashboard.addEventListener('click', () => showSection('dashboard'));
navLogout.addEventListener('click', () => {
    localStorage.removeItem('blogApp_token');
    localStorage.removeItem('blogApp_user');
    token = null;
    currentUser = null;
    updateNav();
    showSection('home');
});

// ==========================================
// Authentication Logic (Real API)
// ==========================================
toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authTitle.innerText = isLoginMode ? 'Login' : 'Sign Up';
    authBtn.innerText = isLoginMode ? 'Login' : 'Sign Up';
    toggleAuthText.innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
    toggleAuthLink.innerText = isLoginMode ? "Sign up" : "Login";
    authMessage.innerText = '';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    const endpoint = isLoginMode ? '/auth/login' : '/auth/signup';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Something went wrong');

        if (!isLoginMode) {
            authMessage.innerText = 'Signup successful! Please login.';
            authMessage.style.color = 'green';
            toggleAuthLink.click();
        } else {
            token = data.token;
            currentUser = data.username;
            localStorage.setItem('blogApp_token', token);
            localStorage.setItem('blogApp_user', currentUser);
            
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            updateNav();
            showSection('dashboard');
        }
    } catch (err) {
        authMessage.innerText = err.message;
        authMessage.style.color = 'red';
    }
});

// ==========================================
// Blog Post Logic (Real API)
// ==========================================

// 1. FETCH ALL POSTS
async function fetchPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        posts = await response.json();
        
        // Update the screen based on which section is currently visible
        if (!publicSection.classList.contains('hidden')) renderPublicPosts();
        if (!dashboardSection.classList.contains('hidden')) renderUserPosts();
    } catch (err) {
        console.error('Failed to fetch posts', err);
    }
}

// Show/Hide Editor
showEditorBtn.addEventListener('click', () => {
    postForm.reset();
    document.getElementById('post-id').value = '';
    editorTitle.innerText = 'Write a new post';
    postEditor.classList.remove('hidden');
});

cancelEditBtn.addEventListener('click', () => {
    postEditor.classList.add('hidden');
});

// 2. CREATE OR UPDATE POST
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('post-id').value;
    const titleInput = document.getElementById('post-title').value.trim();
    const contentInput = document.getElementById('post-content').value.trim();

    try {
        if (idInput) {
            // UPDATE existing post (PUT)
            await fetch(`${API_URL}/posts/${idInput}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ title: titleInput, content: contentInput })
            });
        } else {
            // CREATE new post (POST)
            await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ title: titleInput, content: contentInput, author: currentUser })
            });
        }

        postEditor.classList.add('hidden');
        fetchPosts(); // Refresh list from database
    } catch (err) {
        console.error('Failed to save post', err);
    }
});

// Setup form for editing
window.editPost = function(id) {
    // Note: MongoDB uses _id
    const post = posts.find(p => p._id === id);
    if (!post) return;

    document.getElementById('post-id').value = post._id;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    
    editorTitle.innerText = 'Edit your post';
    postEditor.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 3. DELETE POST
window.deletePost = async function(id) {
    if (confirm("Are you sure you want to delete this post?")) {
        try {
            await fetch(`${API_URL}/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchPosts(); // Refresh list from database
        } catch (err) {
            console.error('Failed to delete post', err);
        }
    }
};

// ==========================================
// Rendering Posts
// ==========================================
function createPostHTML(post, isOwner = false) {
    // Format MongoDB date safely
    const dateStr = new Date(post.createdAt).toLocaleDateString();

    let html = `
        <div class="post-card">
            <h3>${post.title}</h3>
            <div class="post-meta">By <strong>${post.author}</strong> on ${dateStr}</div>
            <div class="post-content">${post.content}</div>
    `;

    if (isOwner) {
        // Notice we are passing post._id instead of post.id
        html += `
            <div class="post-controls">
                <button class="edit-btn" onclick="editPost('${post._id}')">Edit</button>
                <button class="delete-btn" onclick="deletePost('${post._id}')">Delete</button>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

function renderPublicPosts() {
    publicPostsContainer.innerHTML = '';
    if (posts.length === 0) {
        publicPostsContainer.innerHTML = '<p>No posts available yet. Be the first to write one!</p>';
        return;
    }
    
    posts.forEach(post => {
        publicPostsContainer.innerHTML += createPostHTML(post, false);
    });
}

function renderUserPosts() {
    userPostsContainer.innerHTML = '';
    // Filter posts for the logged in user based on the author name
    const myPosts = posts.filter(post => post.author === currentUser);

    if (myPosts.length === 0) {
        userPostsContainer.innerHTML = '<p style="color: #7f8c8d;">You haven\'t published any posts yet.</p>';
        return;
    }

    myPosts.forEach(post => {
        userPostsContainer.innerHTML += createPostHTML(post, true);
    });
}