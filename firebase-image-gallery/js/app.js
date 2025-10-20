/*
Declan:
app.js is the main application file of the web app. It will import functions from the 
other js modules and coordinate between them. It will also initialize the application on page load
and manage the application state. On initialization is will check for correct firebase configuration
and provide feedback or error handling dependant on its success
*/
/*
Declan: 
This section imports functions from the other js modules that will be needed to run the app.
An improvement for this section could be a consistent format for importing multiple components,
as it currently exists the firebase config components are multi-line and the image grid components
are written on one line.
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
Declan: 
The appState object holds the current state of the application using four different properties.
It can be used to tell us what is the app is currently doing. initially this object is created with an
empty array and null values as placeholders for the gridElement and uploadFormElement.
*/
const appState = {
    images: [],              // Array of all images currently loaded
    isLoading: false,        // Whether we're currently loading data
    gridElement: null,       // Reference to the grid DOM element
    uploadFormElement: null  // Reference to the upload form DOM element
};
/*
Declan: 
This function initializes the app. it is an asynchronous function allowing the code to execute
while waiting for information from other functions such as loadAndDisplayImages.
*/
async function initializeApp() {
    console.log('Initializing Firebase Image Gallery...');

/*
Declan: 
This if statements checks that firebase is properly configured using the isFireBaseConfigured function
imported from firebaseConfig. If firebase is not properly configured it will exit the function and
display an error to the user
*/
    if (!isFirebaseConfigured()) {
        showConfigurationError();
        return; // Stop here - can't proceed without Firebase
    }

/*
Declan: 
This section is for the creation and rendering of the different components. It creates the upload form
and a variable to store the uploaded container element.
*/
/*
Declan: 
This section creates an uploadForm variable and uses the constructor function 'createUploadForm' from
uploadForm.js to assign an object to the variable. The objects properties are in the form of two callbacks
for functions created further down this page and a storage property that is assigned the 'storage' module 
import from firebaseConfig.
*/
    try {
        // Create upload form with callbacks
        const uploadForm = createUploadForm({
            onUploadSuccess: handleUploadSuccess,
            onUploadError: handleUploadError,
            storage: storage
        });

/*
Declan: 
This creates the upload container variable and assigns it to the element with the id 'upload-container'
It only does this if that element exists in the DOM
*/
        const uploadContainer = document.getElementById('upload-container');
        if (uploadContainer) {
            uploadContainer.appendChild(uploadForm);
            appState.uploadFormElement = uploadForm;
            console.log('Upload form created');
        }
/*
Declan: 
The function loadAndDisplayImages is called, found further down this page. the await keyword is used
so that the function stops executing until the promise is recieved from this function.
*/
        await loadAndDisplayImages();
/*
Declan: 
Upon the success of loading and displaying images a message is logged to the console to inform the user
*/
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
/*
Declan: 
This function gets the images from firebase storage and renders them on the page.
it is called in the above function that runs on DOM load.
*/
async function loadAndDisplayImages() {
    /*
    Declan: 
    A message is logged to the console to inform the user that the images are laoding
    the appState object is updated to reflect the the images are loading my changing the
    isLoading property to true
    */
    console.log('Loading images from Firebase...');

    appState.isLoading = true;
    /*
    Declan: 
    This section fetches all the images from firebase storage using the listAllImages function
    imported from firebaseConfig. It assigns the images as an
    array of image objects with a url, a name, and a timestamp to the 'images' variable.
    the await keyword again pauses the current function until listAllImages executes.
    */
    try {
        const images = await listAllImages();
        /*
        Declan: 
        The appState object is updated again, assigning the new image array to the 'images' property
        and changing the isLoading property back to false to show that it is finished loading.
        */
        appState.images = images;
        appState.isLoading = false;

        /*
        Declan: 
        A gridContainer variable is created and assigned to the HTML element with the id 'image-grid-container'
        */
        const gridContainer = document.getElementById('image-grid-container');
        /*
        Declan: 
        This section executes if the image-grid-container element does not exist and creates a new grid.
        It uses the createImageGrid constructor function to create an image grid object and assign it
        to the gridElement property in the appState object. It also uploads the appState object to reflect
        that it has finished loading. It then uses the appendChild function to place the new grid element
        into the image grid container. It then logs to the user whether the image grid was created or updated.
        */
        if (gridContainer) {
            if (!appState.gridElement) {
                appState.gridElement = createImageGrid({
                    images: images,
                    isLoading: false
                });
                gridContainer.appendChild(appState.gridElement);
                console.log('Image grid created');
            } else {
                updateImageGrid(appState.gridElement, images);
                console.log('Image grid updated');
            }
        }

        /*
        Declan: 
        Upon an image upload a message is displayed to the user telling them how many images were loaded
        */
        if (images.length > 0) {
            showStatusMessage(`Loaded ${images.length} image(s)`, 'success');
        }
    /*
    Declan: 
    If the listAllImages function is unsuccesful the following code will run.
    The relevant error will be displayed to the user in the console, along with text informing them
    that the app failed to load images. An image grid element will still be created and the appstates
    gridElement property will be updated to hold a new imageGrid object with an empty array. This empty image grid
    will then be placed inside the image-grid-container element so that the UI renders correctly.
    */
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
/*
Declan: 
This function is used to handle successful image uploads, it takes the imageData variable as a paramater
the image data variable is created in imageCard.js and holds url, name, and timestamp properties. The function
logs a message to the console containing these properties on successful upload.
*/
function handleUploadSuccess(imageData) {
    console.log('Upload successful, updating gallery...', imageData);

    /*
    Declan: 
    the unshift() function is used to add the new imageData object to the beginning of the images array,
    stored in the images property of the appState function.
    */
    appState.images.unshift(imageData);

    /*
    Declan: 
    If the gridElement property of the appState object exists, the addImageToGrid function imported from imageGrid.js
    is used to add the new imageData object to the gridElement property of the appState object
    */
    if (appState.gridElement) {
        addImageToGrid(appState.gridElement, imageData);
    }
    /*
    Declan: 
    Message is deisplayed to the console showing successful upload
    */
    showStatusMessage('Image uploaded successfully!', 'success');
}
/*
Declan: 
This function is used to handle an upload error, the specific error object encountered is passed as a parameter
into the function in order to display it to the user in the console
*/
function handleUploadError(error) {
    console.error('Upload failed:', error);

    // Show error message to user
    showStatusMessage(`Upload failed: ${error.message}`, 'error');
}
/*
Declan: 
The showStatusMessage function is used to display messages to the user. It takes a message string,
a type, and a duration as parameters in order to display all the relevant information to the user.
*/
function showStatusMessage(message, type = 'info', duration = 5000) {
    const statusElement = document.getElementById('status-message');

    if (!statusElement) {
        console.warn('Status message element not found');
        return;
    }
    /*
    Declan: 
    Clear the current message, set the new message text and type, and show the message to the user
    */
    statusElement.classList.remove('success', 'error', 'info', 'show');

    statusElement.textContent = message;

    statusElement.classList.add(type);

    statusElement.classList.add('show');

/*
Declan: 
Hide the message after the timeout given in the 'duration' parameter
*/
    if (statusElement.hideTimeout) {
        clearTimeout(statusElement.hideTimeout);
    }

    statusElement.hideTimeout = setTimeout(() => {
        statusElement.classList.remove('show');
    }, duration);
}
/*
Declan: 
This function is used to display a configuration error in the form of a new element that is added to the DOM.
This new element contains instrucitons for the user to fix their firebase configuration.
*/
function showConfigurationError() {
    /*
    Declan: 
    creates a mainContent variable targeting the element with the class main-content
    */
    const mainContent = document.querySelector('.main-content');
    /*
    Declan: 
    if no element with the class main-content exists the funciton ends
    */
    if (!mainContent) return;

    /*
        Create an error message with instructions
        This is more helpful than a generic error
    */
   /*
    Declan: 
    This section creates a new HTML div element and assigns it to the variable errorContainer.
    The element contains detailed information explaining to the user some potential fixes for
    their firebase configuration issues. The element is then appended within the errorContainer
    element that was created.
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

    /*
    Declan: 
    the error container is then added to the DOM
    */
    mainContent.insertBefore(errorContainer, mainContent.firstChild);

    /*
    Declan: 
    The other sections of the page are hidden until the errors are fixed
    */
    const uploadSection = document.querySelector('.upload-section');
    const gallerySection = document.querySelector('.gallery-section');
    /*
    Declan: 
    Improvement:
    Instead of directly manipulating the style properties of the elements, classlist.add or classlist.toggle
    could add or remove the 'hidden' class that is already defined as display: none; in our CSS
    */
    if (uploadSection) uploadSection.style.display = 'none';
    if (gallerySection) gallerySection.style.display = 'none';
}
/*
Declan: 
The refreshGallery function is used to reload the images from firebase storage in case any changes were made
directly to them outside of the app. The function can be called automatically on a set interval or triggered on
page refresh
*/
async function refreshGallery() {
    /*
    Declan: 
    The user is informed in the console that the gallery is refreshing and more details are given using the
    showStatusMessage function created earlier
    */
    console.log('Refreshing gallery...');
    showStatusMessage('Refreshing gallery...', 'info', 2000);
    /*
    Declan: 
    The loadAndDisplayImages function is then called, using the await keyword again to pause the refreshGallery
    function until the promise is recieved. On success the relevant status message is shown. On error the user
    is also informed in the console with a relevant error message.
    */
    try {
        await loadAndDisplayImages();
        showStatusMessage('Gallery refreshed', 'success', 2000);
    } catch (error) {
        console.error('Refresh failed:', error);
        showStatusMessage('Failed to refresh gallery', 'error');
    }
}
/*
Declan: 
Get appstate helper function that can be used throughout the app to return the current appState, the amount of images
in the images array, and the status of the apps firebase configuration
*/
function getAppState() {
    return {
        ...appState,
        imageCount: appState.images.length,
        isConfigured: isFirebaseConfigured()
    };
}
/*
Declan: 
These functions can be manually called by the user in the console in order to view the app state and refresh the gallery
USeful for troubleshooting and debugging
*/
window.refreshGallery = refreshGallery;
window.appState = getAppState;
/*
Declan: 
On DOM load, the intializeApp function is called to start the app, and a message is displayed to the console.
*/
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    initializeApp();
});
/*
Declan: 
Handler for unexpected errors, prompting the user to refresh the page and displaying error information.
*/
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    showStatusMessage('An unexpected error occurred. Please refresh the page.', 'error');
});
/*
Declan: 
Handles promise rejections within our async functions, displaying relevant information to the user
*/
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showStatusMessage('An error occurred. Please check the console for details.', 'error');
});

/*
Declan: 
Export the functions for usage within other modules or for testing purposes
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
