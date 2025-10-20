/*
    Upload Form Component
    Handles file selection and upload to Firebase Storage

    This component demonstrates:
    1. Form creation and validation
    2. File handling in the browser
    3. Progress tracking during uploads
    4. User feedback (success, error, loading states)
    5. Integration with Firebase Storage
*/

/*
    Import Firebase helper functions
    These were created in firebaseConfig.js
    We use them here to upload files and validate them
*/
import { uploadFile, validateImageFile } from '../js/firebaseConfig.js';

/*
    Factory Function: createUploadForm

    Creates a form for uploading images to Firebase Storage
    Includes file validation, progress tracking, and error handling

    Parameters:
    - options: Object with configuration
        - onUploadSuccess: Callback when upload completes successfully
        - onUploadError: Callback when upload fails
        - storage: Firebase storage instance (not used directly here but passed through)

    Returns:
    - A DOM element containing the complete upload form
*/
export function createUploadForm(options = {}) {
    /*
        Destructure options with default values
        Using empty arrow functions as defaults prevents errors
        if callbacks aren't provided
    */
    const {
        onUploadSuccess = () => {},
        onUploadError = () => {}
    } = options;

    /*
        Create form container
        We use a div instead of <form> tag to avoid page reload on submit
        (We'll handle submission with JavaScript instead)
    */
    const formContainer = document.createElement('div');
    formContainer.className = 'upload-form';

    /*
        Create form title
        Tells users what this section does
    */
    const title = document.createElement('h2');
    title.className = 'form-title';
    title.textContent = 'Upload Image';

    /*
        Create form description
        Provides guidance about file requirements
    */
    const description = document.createElement('p');
    description.className = 'form-description';
    description.textContent = 'Select an image file to upload to your gallery (JPEG, PNG, GIF, or WebP, max 5MB)';

    /*
        Create file input wrapper
        Groups the label and input together
    */
    const fileInputWrapper = document.createElement('div');
    fileInputWrapper.className = 'file-input-wrapper';

    /*
        Create file input label
        Labels improve accessibility and usability
        They tell users what the input is for
    */
    const label = document.createElement('label');
    label.className = 'file-input-label';
    label.textContent = 'Choose Image:';
    label.htmlFor = 'file-input'; // Links label to input

    /*
        Create file input
        This is the main control where users select files

        Important attributes:
        - type="file": Creates a file picker
        - accept="image/*": Only shows image files in picker
        - id: Links to label for accessibility
    */
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file-input';
    fileInput.accept = 'image/*'; // Only accept image files
    fileInput.className = 'file-input';
    fileInput.setAttribute('aria-label', 'Choose image file to upload');

    /*
        Create upload button
        This triggers the upload process
        Initially disabled until a file is selected
    */
    const uploadButton = document.createElement('button');
    uploadButton.type = 'button'; // Prevents form submission
    uploadButton.className = 'btn btn-primary';
    uploadButton.textContent = 'Upload Image';
    uploadButton.disabled = true; // Disabled until file is selected
    uploadButton.setAttribute('aria-label', 'Upload selected image');

    /*
        Create progress container
        Shows upload progress with a progress bar
        Hidden by default, shown when upload starts
    */
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    const progressBarWrapper = document.createElement('div');
    progressBarWrapper.className = 'progress-bar-wrapper';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', '0');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');

    const progressText = document.createElement('p');
    progressText.className = 'progress-text';
    progressText.textContent = 'Ready to upload';

    // Assemble progress elements
    progressBarWrapper.appendChild(progressBar);
    progressContainer.appendChild(progressBarWrapper);
    progressContainer.appendChild(progressText);

    /*
        Event Handler: File Input Change
        Fires when user selects a file

        This handler:
        1. Gets the selected file
        2. Validates it
        3. Enables/disables upload button
        4. Shows validation errors if any
    */
    fileInput.addEventListener('change', (event) => {
        /*
            Get the selected file
            event.target.files is a FileList (array-like object)
            [0] gets the first file (we only allow single file selection)
        */
        const file = event.target.files[0];

        // Check if a file was actually selected
        if (!file) {
            uploadButton.disabled = true;
            progressText.textContent = 'No file selected';
            return;
        }

        console.log('File selected:', file.name);

        /*
            Validate the file
            Our validateImageFile function checks:
            - File type (must be an image)
            - File size (must be under 5MB)
        */
        const validation = validateImageFile(file);

        if (validation.valid) {
            // File is valid - enable upload button
            uploadButton.disabled = false;
            progressText.textContent = `Ready to upload: ${file.name}`;
            progressText.style.color = 'var(--text-color)';
        } else {
            // File is invalid - show error and keep button disabled
            uploadButton.disabled = true;
            progressText.textContent = `Error: ${validation.error}`;
            progressText.style.color = 'var(--error-color)';
            console.warn('⚠️ File validation failed:', validation.error);
        }
    });

    /*
        Event Handler: Upload Button Click
        Fires when user clicks the upload button

        This handler:
        1. Gets the selected file
        2. Validates it again (for safety)
        3. Starts the upload
        4. Tracks upload progress
        5. Handles success or error
    */
    uploadButton.addEventListener('click', async () => {
        // Get the file
        const file = fileInput.files[0];

        // Safety check - should always have a file here since button is disabled otherwise
        if (!file) {
            console.error('No file selected');
            return;
        }

        // Double-check validation
        const validation = validateImageFile(file);
        if (!validation.valid) {
            progressText.textContent = `Error: ${validation.error}`;
            progressText.style.color = 'var(--error-color)';
            return;
        }

        console.log('Starting upload:', file.name);

        /*
            Disable controls during upload
            This prevents users from:
            - Selecting a new file while uploading
            - Clicking upload button multiple times
        */
        fileInput.disabled = true;
        uploadButton.disabled = true;
        uploadButton.textContent = 'Uploading...';

        // Show progress container
        progressContainer.classList.add('active');

        /*
            Progress callback function
            Called multiple times during upload with progress percentage

            Parameters:
            - progress: Number from 0-100 representing percentage complete
        */
        const onProgress = (progress) => {
            // Update progress bar width
            progressBar.style.width = `${progress}%`;

            // Update ARIA attribute for screen readers
            progressBar.setAttribute('aria-valuenow', progress);

            // Update progress text
            progressText.textContent = `Uploading: ${progress}%`;

            console.log(`Upload progress: ${progress}%`);
        };

        /*
            Error callback function
            Called if upload fails for any reason

            Parameters:
            - error: Error object with message
        */
        const onError = (error) => {
            console.error('Upload failed:', error);

            // Update UI to show error
            progressText.textContent = `Error: ${error.message}`;
            progressText.style.color = 'var(--error-color)';

            // Reset controls
            fileInput.disabled = false;
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload Image';

            // Hide progress bar after a delay
            setTimeout(() => {
                progressContainer.classList.remove('active');
                progressBar.style.width = '0%';
            }, 3000);

            // Call parent error callback
            onUploadError(error);
        };

        /*
            Success callback function
            Called when upload completes successfully

            Parameters:
            - data: Object with url, name, fullPath, timestamp
        */
        const onComplete = (data) => {
            console.log('Upload complete:', data);

            // Update UI to show success
            progressBar.style.width = '100%';
            progressText.textContent = 'Upload complete!';
            progressText.style.color = 'var(--success-color)';

            // Call parent success callback
            // This typically adds the image to the gallery
            onUploadSuccess(data);

            /*
                Reset the form after successful upload
                Allows user to upload another image
                We wait 2 seconds so user can see success message
            */
            setTimeout(() => {
                // Reset file input
                fileInput.value = '';
                fileInput.disabled = false;

                // Reset button
                uploadButton.disabled = true;
                uploadButton.textContent = 'Upload Image';

                // Hide progress
                progressContainer.classList.remove('active');
                progressBar.style.width = '0%';
                progressText.textContent = 'Ready to upload';
                progressText.style.color = 'var(--text-color)';
            }, 2000);
        };

        /*
            Start the upload!
            Call our uploadFile function from firebaseConfig.js
            Pass the file and our three callback functions

            This function handles all the Firebase Storage complexity
            We just provide callbacks to respond to different events
        */
        try {
            uploadFile(file, onProgress, onError, onComplete);
        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
        }
    });

    /*
        Assemble the form
        Add all elements in the correct order
    */
    fileInputWrapper.appendChild(label);
    fileInputWrapper.appendChild(fileInput);

    formContainer.appendChild(title);
    formContainer.appendChild(description);
    formContainer.appendChild(fileInputWrapper);
    formContainer.appendChild(uploadButton);
    formContainer.appendChild(progressContainer);

    // Return the complete form
    return formContainer;
}

/*
    Alternative: Drag and Drop Upload Form
    Enhanced version with drag-and-drop functionality

    This is an extension idea for intermediate students
    Shows how to handle drag-and-drop file uploads
*/
export function createDragDropUploadForm(options = {}) {
    // Create basic form first
    const form = createUploadForm(options);

    // Get the file input wrapper
    const fileInputWrapper = form.querySelector('.file-input-wrapper');

    // Add drag-and-drop event handlers
    if (fileInputWrapper) {
        /*
            Prevent default drag behaviors
            By default, browsers navigate to dropped files
            We prevent this to handle the drop ourselves
        */
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileInputWrapper.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Visual feedback when file is dragged over
        ['dragenter', 'dragover'].forEach(eventName => {
            fileInputWrapper.addEventListener(eventName, () => {
                fileInputWrapper.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileInputWrapper.addEventListener(eventName, () => {
                fileInputWrapper.classList.remove('drag-over');
            });
        });

        // Handle dropped files
        fileInputWrapper.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            const fileInput = form.querySelector('.file-input');

            // Assign dropped files to file input
            if (files.length > 0) {
                fileInput.files = files;

                // Trigger change event to run validation
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    return form;
}

/*
    CSS for drag-and-drop effect (add to style.css if using createDragDropUploadForm):

    .file-input-wrapper.drag-over {
        border-color: var(--primary-color);
        background-color: #f0f7ff;
    }

    .file-input-wrapper {
        border: 2px dashed var(--border-color);
        padding: 2rem;
        border-radius: var(--border-radius);
        transition: all 0.3s ease;
    }
*/

/*
    USAGE EXAMPLE:

    const uploadForm = createUploadForm({
        onUploadSuccess: (data) => {
            console.log('Image uploaded:', data);
            // Add image to gallery
            addImageToGrid(gridElement, data);
        },
        onUploadError: (error) => {
            console.error('Upload failed:', error);
            // Show error message to user
            showStatusMessage(error.message, 'error');
        }
    });

    document.getElementById('upload-container').appendChild(uploadForm);
*/
