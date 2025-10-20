/*
    Firebase Configuration File
    This file handles all Firebase setup and initialization
    Students must replace placeholder values with their own Firebase project credentials
*/

/*
    Import Firebase modules using ES6 import syntax
    We only import what we need to keep the bundle size small

    - initializeApp: Initializes Firebase with your project credentials
    - getStorage: Gives us access to Firebase Storage for file uploads
    - ref: Creates references to storage locations (like file paths)
    - uploadBytesResumable: Uploads files with progress tracking
    - getDownloadURL: Gets the public URL of uploaded files
    - listAll: Lists all files in a storage location
*/
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    listAll
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

/*
    Firebase Configuration Object

    IMPORTANT FOR STUDENTS:
    Replace these placeholder values with your actual Firebase project credentials

    To get these values:
    1. Go to https://console.firebase.google.com/
    2. Create a new project (or select existing one)
    3. Click the gear icon > Project settings
    4. Scroll down to "Your apps" section
    5. Click the web icon (</>) to add a web app
    6. Copy the configuration values from the firebaseConfig object

    Security Note: In a production app, you would want to restrict these keys
    using Firebase Security Rules and domain restrictions in Firebase Console
*/
const firebaseConfig = {
  apiKey: "AIzaSyDGh7LpwNctg8ZZ6vuhbUjdnSmUYjDvHyo",
  authDomain: "web-504-example.firebaseapp.com",
  projectId: "web-504-example",
  storageBucket: "web-504-example.firebasestorage.app",
  messagingSenderId: "823274501791",
  appId: "1:823274501791:web:fc0665bce12f74efbc14aa"
};

/*
    Configuration Validation
    Checks if Firebase has been properly configured
    Returns true if config is valid, false if still using placeholders
*/
export function isFirebaseConfigured() {
    // Check if any value still contains placeholder text
    const hasPlaceholders = firebaseConfig.apiKey === "your-api-key-here" ||
                           firebaseConfig.apiKey.includes("your-");

    if (hasPlaceholders) {
        console.error('Firebase Configuration Error!');
        console.error('Please replace the placeholder values in js/firebaseConfig.js with your actual Firebase credentials.');
        console.error('Visit https://console.firebase.google.com/ to get your config values.');
        return false;
    }

    return true;
}

/*
    Initialize Firebase App
    This creates the connection to your Firebase project
    Think of it like "logging in" to Firebase with your credentials
*/
let app;
let storage;

try {
    // Initialize Firebase with our configuration
    app = initializeApp(firebaseConfig);

    // Get a reference to Firebase Storage
    // This is what we'll use to upload and download files
    storage = getStorage(app);

    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization failed:', error);
    // We'll handle this error in the app
}

/*
    Export storage instance so other files can use it
    This is called "dependency injection" - we create the storage instance
    once here and pass it to components that need it
*/
export { storage };

/*
    Upload File to Firebase Storage

    This function handles the complete upload process:
    1. Creates a unique filename
    2. Creates a storage reference (location where file will be saved)
    3. Starts the upload
    4. Monitors progress
    5. Returns the download URL when complete

    Parameters:
    - file: The File object from the input element
    - onProgress: Callback function that receives progress percentage
    - onError: Callback function that receives error information
    - onComplete: Callback function that receives the download URL

    Why use callbacks?
    File uploads are asynchronous (take time), so we use callbacks to handle
    different stages of the upload process without blocking the rest of the app
*/
export function uploadFile(file, onProgress, onError, onComplete) {
    // Validate that we have a file
    if (!file) {
        onError(new Error('No file provided'));
        return;
    }

    // Create a unique filename using timestamp
    // This prevents files with the same name from overwriting each other
    // Example: "1234567890_myimage.jpg"
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;

    /*
        Create a storage reference
        Think of this as the "address" where the file will be saved
        ref() function takes two parameters:
        1. The storage instance
        2. The path where the file should be saved (like a folder path)
    */
    const storageRef = ref(storage, `images/${filename}`);

    /*
        Start the upload using uploadBytesResumable
        "Resumable" means if the upload fails, it can be continued from where it stopped
        This is better than uploadBytes for larger files or slower connections
    */
    const uploadTask = uploadBytesResumable(storageRef, file);

    /*
        Monitor the upload process
        uploadTask.on() listens for three types of events:
        1. 'state_changed' - Progress updates
        2. Error - If upload fails
        3. Complete - When upload succeeds

        This is the Firebase SDK's way of letting us track what's happening
    */
    uploadTask.on(
        'state_changed',

        // Progress callback - called multiple times as upload progresses
        (snapshot) => {
            /*
                Calculate upload progress as a percentage
                snapshot.bytesTransferred = how much has uploaded
                snapshot.totalBytes = total file size

                Example: 50KB uploaded out of 100KB = 50% progress
            */
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

            // Call the onProgress callback with the percentage
            // This allows the UI to update a progress bar
            onProgress(Math.round(progress));

            // Log the upload state for debugging
            console.log(`Upload is ${progress.toFixed(2)}% done`);

            // You could also check the upload state here
            // snapshot.state can be: 'paused', 'running', or 'success'
        },

        // Error callback - called if upload fails
        (error) => {
            console.error('Upload error:', error);

            // Firebase errors have codes we can check
            // This helps provide better error messages to users
            let errorMessage = 'Upload failed. Please try again.';

            switch (error.code) {
                case 'storage/unauthorized':
                    errorMessage = 'Permission denied. Check Firebase Storage rules.';
                    break;
                case 'storage/canceled':
                    errorMessage = 'Upload was canceled.';
                    break;
                case 'storage/unknown':
                    errorMessage = 'An unknown error occurred during upload.';
                    break;
            }

            onError(new Error(errorMessage));
        },

        // Success callback - called when upload completes
        async () => {
            try {
                /*
                    Get the download URL for the uploaded file
                    This is the public URL that can be used to display the image

                    getDownloadURL returns a Promise, so we use await
                    A Promise is JavaScript's way of handling asynchronous operations
                */
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                console.log('File uploaded successfully');
                console.log('Download URL:', downloadURL);

                // Call the onComplete callback with the file information
                onComplete({
                    url: downloadURL,
                    name: file.name,
                    fullPath: storageRef.fullPath,
                    timestamp: timestamp
                });

            } catch (error) {
                console.error('Error getting download URL:', error);
                onError(error);
            }
        }
    );

    // Return the upload task so it can be canceled if needed
    return uploadTask;
}

/*
    List All Images from Firebase Storage

    Retrieves all images from the 'images/' folder in Firebase Storage
    Returns an array of objects containing image information

    This demonstrates how to read data from Firebase Storage
    vs. uploading (which we did in the uploadFile function)
*/
export async function listAllImages() {
    try {
        // Create a reference to the 'images' folder
        const imagesRef = ref(storage, 'images/');

        /*
            List all items in the folder
            listAll() returns a Promise with all files and subfolders

            The result contains:
            - items: array of file references
            - prefixes: array of subfolder references
        */
        const result = await listAll(imagesRef);

        /*
            For each file, we need to get its download URL
            We use Promise.all() to fetch all URLs at once (in parallel)
            instead of one at a time (which would be slower)

            This is an important pattern for handling multiple async operations
        */
        const imagePromises = result.items.map(async (imageRef) => {
            // Get the download URL for this image
            const url = await getDownloadURL(imageRef);

            // Return an object with all the image information
            return {
                url: url,
                name: imageRef.name,
                fullPath: imageRef.fullPath,
                // Extract timestamp from filename if it exists
                timestamp: imageRef.name.split('_')[0]
            };
        });

        // Wait for all download URLs to be fetched
        const images = await Promise.all(imagePromises);

        console.log(`Found ${images.length} images`);

        // Return the array of image objects
        return images;

    } catch (error) {
        console.error('Error listing images:', error);
        throw error; // Re-throw so calling code can handle it
    }
}

/*
    Helper function to validate file types
    Ensures only image files are uploaded

    This is a security best practice - always validate on both
    client side (here) AND server side (Firebase Storage rules)
*/
export function validateImageFile(file) {
    // List of allowed image MIME types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    // Check if file type is in allowed list
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Please select an image file (JPEG, PNG, GIF, or WebP)'
        };
    }

    // Check file size (limit to 5MB)
    // 5 * 1024 * 1024 = 5242880 bytes = 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size must be less than 5MB'
        };
    }

    // File passed validation
    return {
        valid: true
    };
}

/*
    Export all functions and variables that other files need to use
    This makes them available for import in other JavaScript files

    Example usage in another file:
    import { storage, uploadFile, listAllImages } from './firebaseConfig.js';
*/
