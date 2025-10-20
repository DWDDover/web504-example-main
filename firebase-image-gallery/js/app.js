/*
    Main Application File (app.js)

    This is the entry point and coordinator for our Firebase Image Gallery application

    Responsibilities:
    1. Initialize the application
    2. Coordinate between different components
    3. Manage application state
    4. Handle Firebase configuration checks
    5. Provide utility functions for user feedback

    This file demonstrates:
    - Application architecture and organization
    - State management without frameworks
    - Component composition and coordination
    - Error handling and user feedback
*/

/*
    Import all necessary modules
    We import from both Firebase config and our custom components
*/

// Firebase configuration and utilities
import {
    storage,
    isFirebaseConfigured,
    listAllImages
} from './firebaseConfig.js';

// UI Components
import { createUploadForm } from '../components/uploadForm.js';
import { createImageGrid, addImageToGrid, updateImageGrid } from '../components/imageGrid.js';

/*
    Application State

    This object holds the current state of our application
    Think of it as the "memory" of the app - it tracks what's currently displayed

    In larger apps, you might use a state management library (Redux, Vuex, etc.)
    For a simple app like this, a plain object works great
*/
const appState = {
    images: [],              // Array of all images currently loaded
    isLoading: false,        // Whether we're currently loading data
    gridElement: null,       // Reference to the grid DOM element
    uploadFormElement: null  // Reference to the upload form DOM element
};

/*
    Initialize Application

    This function sets up the entire application
    It's called when the page loads (see bottom of file)

    Steps:
    1. Check Firebase configuration
    2. Create and render components
    3. Load initial data
    4. Set up event handlers
*/
async function initializeApp() {
    console.log('Initializing Firebase Image Gallery...');

    /*
        Step 1: Verify Firebase Configuration
        Before we do anything else, make sure Firebase is properly set up
        If not, show an error and stop initialization
    */
    if (!isFirebaseConfigured()) {
        showConfigurationError();
        return; // Stop here - can't proceed without Firebase
    }

    /*
        Step 2: Create and Render Components
        Build our UI by creating each component and adding it to the page
    */
    try {
        // Create upload form with callbacks
        const uploadForm = createUploadForm({
            onUploadSuccess: handleUploadSuccess,
            onUploadError: handleUploadError,
            storage: storage
        });

        // Add upload form to the page
        const uploadContainer = document.getElementById('upload-container');
        if (uploadContainer) {
            uploadContainer.appendChild(uploadForm);
            appState.uploadFormElement = uploadForm;
            console.log('Upload form created');
        }

        /*
            Step 3: Load and Display Images
            Fetch all existing images from Firebase Storage and display them
        */
        await loadAndDisplayImages();

        console.log('Application initialized successfully');

    } catch (error) {
        console.error('Application initialization failed:', error);
        showStatusMessage('Failed to initialize application. Please refresh the page.', 'error');
    }
}

/*
    Load and Display Images

    Fetches all images from Firebase Storage and displays them in the grid
    This is called:
    - During initial app load
    - After manual refresh (if implemented)
    - Optionally after each upload (we add single images instead for better UX)
*/
async function loadAndDisplayImages() {
    console.log('Loading images from Firebase...');

    // Set loading state
    appState.isLoading = true;

    try {
        /*
            Fetch all images from Firebase Storage
            listAllImages() is defined in firebaseConfig.js
            It returns an array of image objects with url, name, timestamp
        */
        const images = await listAllImages();

        // Update application state
        appState.images = images;
        appState.isLoading = false;

        /*
            Create or update the image grid
            If grid doesn't exist yet, create it
            If it does exist, update it with new data
        */
        const gridContainer = document.getElementById('image-grid-container');

        if (gridContainer) {
            if (!appState.gridElement) {
                // First time - create new grid
                appState.gridElement = createImageGrid({
                    images: images,
                    isLoading: false
                });
                gridContainer.appendChild(appState.gridElement);
                console.log('Image grid created');
            } else {
                // Grid exists - update it
                updateImageGrid(appState.gridElement, images);
                console.log('Image grid updated');
            }
        }

        // Show success message if images were loaded
        if (images.length > 0) {
            showStatusMessage(`Loaded ${images.length} image(s)`, 'success');
        }

    } catch (error) {
        console.error('Failed to load images:', error);
        appState.isLoading = false;

        // Show error message to user
        showStatusMessage('Failed to load images. Please check your Firebase configuration.', 'error');

        // Still create an empty grid so UI isn't broken
        const gridContainer = document.getElementById('image-grid-container');
        if (gridContainer && !appState.gridElement) {
            appState.gridElement = createImageGrid({
                images: [],
                isLoading: false
            });
            gridContainer.appendChild(appState.gridElement);
        }
    }
}

/*
    Handle Upload Success

    Called when an image is successfully uploaded
    This is passed as a callback to the upload form component

    Parameters:
    - imageData: Object containing { url, name, timestamp, fullPath }
*/
function handleUploadSuccess(imageData) {
    console.log('Upload successful, updating gallery...', imageData);

    /*
        Add the new image to our state
        We add it at the beginning so newest images appear first
    */
    appState.images.unshift(imageData);

    /*
        Update the grid with the new image
        Instead of reloading all images, we just add this one
        This is more efficient and provides better UX
    */
    if (appState.gridElement) {
        addImageToGrid(appState.gridElement, imageData);
    }

    // Show success message
    showStatusMessage('Image uploaded successfully!', 'success');
}

/*
    Handle Upload Error

    Called when an upload fails
    This is passed as a callback to the upload form component

    Parameters:
    - error: Error object with message
*/
function handleUploadError(error) {
    console.error('Upload failed:', error);

    // Show error message to user
    showStatusMessage(`Upload failed: ${error.message}`, 'error');
}

/*
    Show Status Message

    Displays a temporary message to the user
    Used for success messages, errors, and info

    Parameters:
    - message: String to display
    - type: 'success', 'error', or 'info'
    - duration: How long to show message (ms), default 5000 (5 seconds)
*/
function showStatusMessage(message, type = 'info', duration = 5000) {
    const statusElement = document.getElementById('status-message');

    if (!statusElement) {
        console.warn('Status message element not found');
        return;
    }

    /*
        Clear any existing message
        Remove all type classes first
    */
    statusElement.classList.remove('success', 'error', 'info', 'show');

    // Set the message text
    statusElement.textContent = message;

    // Add the appropriate type class
    statusElement.classList.add(type);

    // Show the message
    statusElement.classList.add('show');

    /*
        Hide the message after duration
        clearTimeout prevents multiple timers if function is called rapidly
    */
    if (statusElement.hideTimeout) {
        clearTimeout(statusElement.hideTimeout);
    }

    statusElement.hideTimeout = setTimeout(() => {
        statusElement.classList.remove('show');
    }, duration);
}

/*
    Show Configuration Error

    Displays a helpful error when Firebase is not configured
    Tells students exactly what they need to do
*/
function showConfigurationError() {
    const mainContent = document.querySelector('.main-content');

    if (!mainContent) return;

    /*
        Create an error message with instructions
        This is more helpful than a generic error
    */
    const errorContainer = document.createElement('div');
    errorContainer.className = 'status-message error show';
    errorContainer.innerHTML = `
        <div style="flex: 1;">
            <h3 style="margin-bottom: 0.5rem;">Firebase Not Configured</h3>
            <p style="margin-bottom: 0.5rem;">
                Please configure Firebase before using this application.
            </p>
            <ol style="margin: 1rem 0; padding-left: 1.5rem; text-align: left;">
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank"
                    style="color: inherit; text-decoration: underline;">Firebase Console</a></li>
                <li>Create a new project (or select an existing one)</li>
                <li>Enable Firebase Storage in your project</li>
                <li>Get your configuration values from Project Settings</li>
                <li>Update the values in <code>js/firebaseConfig.js</code></li>
                <li>Refresh this page</li>
            </ol>
            <p style="font-size: 0.9rem; opacity: 0.9;">
                See README.md for detailed setup instructions.
            </p>
        </div>
    `;

    // Add to page at the top
    mainContent.insertBefore(errorContainer, mainContent.firstChild);

    // Hide other sections until configured
    const uploadSection = document.querySelector('.upload-section');
    const gallerySection = document.querySelector('.gallery-section');

    if (uploadSection) uploadSection.style.display = 'none';
    if (gallerySection) gallerySection.style.display = 'none';
}

/*
    Refresh Gallery

    Reloads all images from Firebase Storage
    Useful if images were added/deleted outside this app

    This could be called by a refresh button or automatically on interval
*/
async function refreshGallery() {
    console.log('Refreshing gallery...');
    showStatusMessage('Refreshing gallery...', 'info', 2000);

    try {
        await loadAndDisplayImages();
        showStatusMessage('Gallery refreshed', 'success', 2000);
    } catch (error) {
        console.error('Refresh failed:', error);
        showStatusMessage('Failed to refresh gallery', 'error');
    }
}

/*
    Get Application State

    Helper function that returns current app state
    Useful for debugging or for extension features

    Usage in browser console:
    window.appState
*/
function getAppState() {
    return {
        ...appState,
        imageCount: appState.images.length,
        isConfigured: isFirebaseConfigured()
    };
}

/*
    Expose useful functions to window object
    Makes them available for:
    - Debugging in browser console
    - Extension by students
    - Integration with other scripts

    Students can open browser console and type:
    - window.refreshGallery() to manually refresh
    - window.appState to see current state
*/
window.refreshGallery = refreshGallery;
window.appState = getAppState;

/*
    Application Initialization

    Wait for DOM to be fully loaded before initializing
    This ensures all HTML elements exist before we try to access them

    DOMContentLoaded fires when HTML is parsed and DOM is ready
    This happens before images/stylesheets finish loading (faster than 'load' event)
*/
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    initializeApp();
});

/*
    Handle page visibility changes
    Optionally refresh when user returns to the tab

    This is commented out by default because it may be unnecessary
    Uncomment if you want auto-refresh behavior
*/
/*
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isFirebaseConfigured()) {
        console.log('Page visible again, checking for updates...');
        refreshGallery();
    }
});
*/

/*
    Error Handler for Unhandled Errors

    Catches any errors that slip through
    Logs them and shows a user-friendly message

    This is a safety net for unexpected errors
*/
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    showStatusMessage('An unexpected error occurred. Please refresh the page.', 'error');
});

/*
    Handle Promise Rejections

    Catches any unhandled promise rejections
    Common with async operations like Firebase calls
*/
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showStatusMessage('An error occurred. Please check the console for details.', 'error');
});

/*
    Export for testing or module usage
    If you're using this in a test environment, these exports are helpful
*/
export {
    initializeApp,
    loadAndDisplayImages,
    handleUploadSuccess,
    handleUploadError,
    showStatusMessage,
    refreshGallery,
    getAppState
};

/*
    ARCHITECTURE NOTES FOR STUDENTS:

    This file follows the "Coordinator" pattern:
    - It doesn't contain business logic (that's in components and firebaseConfig)
    - It doesn't create complex UI (that's in components)
    - It coordinates between different parts of the app
    - It manages application-level state

    Benefits of this approach:
    - Each file has a clear, single responsibility
    - Components are reusable and testable
    - Easy to understand flow of data and events
    - Easy to add new features without breaking existing ones

    As you learn more about web development, you'll encounter frameworks
    like React, Vue, or Angular that provide more sophisticated ways to
    handle these same concerns. But the fundamental concepts here
    (component composition, state management, event handling) remain the same!
*/
