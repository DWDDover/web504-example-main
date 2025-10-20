/*
Declan: a new export function to create an image card that takes 'imageData', an
empty object, as a parameter.

*/
export function createImageCard(imageData = {}) {
/*
Declan: create an imageData object with the properties url, name, and timestamp. these will be taken from
another module that imports and calls this function

*/
    const { url, name, timestamp } = imageData;
/*
Declan: create a card variable that holds 

*/
    const card = document.createElement('article');
    card.className = 'image-card';

    /*
        Create the image container
        This wrapper helps maintain aspect ratio and control image behavior
    */
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    /*
        Create the image element
        We set up loading states and error handling for better UX
    */
    const img = document.createElement('img');

    // Add a loading class initially (can be styled with CSS)
    img.className = 'loading';

    /*
        Set alt text for accessibility
        Alt text is read by screen readers and shown if image fails to load
        It should describe the image content
    */
    img.alt = name || 'Gallery image';

    /*
        Add loading="lazy" attribute
        This tells the browser to only load images when they're about to enter the viewport
        Great for performance with many images!

        How it works:
        - Images below the fold don't load immediately
        - As user scrolls down, images load just before becoming visible
        - Saves bandwidth and improves initial page load time
    */
    img.loading = 'lazy';

    /*
        Handle successful image load
        When image loads, we remove the loading class and add loaded class
        This can trigger CSS transitions for smooth appearance
    */
    img.addEventListener('load', () => {
        img.classList.remove('loading');
        img.classList.add('loaded');
        console.log(`Image loaded: ${name}`);
    });

    /*
        Handle image load errors
        If image fails to load, show a placeholder or error state
        This prevents broken image icons from appearing
    */
    img.addEventListener('error', () => {
        img.classList.remove('loading');
        img.classList.add('error');
        console.error(`Failed to load image: ${name}`);

        // Set alt text to indicate error
        img.alt = 'Failed to load image';

        // You could also set a placeholder image here:
        // img.src = '../assets/placeholder.svg';
    });

    // Set the image source
    // This triggers the browser to start downloading the image
    img.src = url;

    /*
        Create info section
        This contains the image name and metadata
    */
    const info = document.createElement('div');
    info.className = 'image-info';

    /*
        Create and set image name
        We use a paragraph for the name (could also use h3 for heading)
    */
    const imageName = document.createElement('p');
    imageName.className = 'image-name';
    imageName.textContent = formatFileName(name);

    /*
        Create and set metadata
        Shows when the image was uploaded
    */
    const meta = document.createElement('p');
    meta.className = 'image-meta';
    meta.textContent = formatTimestamp(timestamp);

    /*
        Assemble the component
        This is the order elements will appear in the DOM tree

        Structure:
        <article class="image-card">
            <div class="image-container">
                <img />
            </div>
            <div class="image-info">
                <p class="image-name">...</p>
                <p class="image-meta">...</p>
            </div>
        </article>
    */

    // Add image to its container
    imageContainer.appendChild(img);

    // Add name and meta to info section
    info.appendChild(imageName);
    info.appendChild(meta);

    // Add both sections to the card
    card.appendChild(imageContainer);
    card.appendChild(info);

    // Return the complete card element
    return card;
}

/*
    Helper Function: formatFileName

    Cleans up the filename for display
    - Removes timestamp prefix that we added during upload
    - Handles long filenames gracefully

    Example:
    Input: "1234567890_my-vacation-photo.jpg"
    Output: "my-vacation-photo.jpg"
*/
function formatFileName(filename) {
    if (!filename) {
        return 'Untitled';
    }

    /*
        Remove timestamp prefix if it exists
        Our upload function adds "timestamp_" to the beginning
        We split by underscore and take everything after the first one
    */
    const parts = filename.split('_');

    // If there's an underscore, remove the timestamp part
    if (parts.length > 1) {
        // Join the rest back together (in case filename had underscores)
        return parts.slice(1).join('_');
    }

    // If no underscore found, return the original filename
    return filename;
}

/*
    Helper Function: formatTimestamp

    Converts timestamp to human-readable date
    Makes the upload date/time more user-friendly

    Example:
    Input: "1234567890" (Unix timestamp in milliseconds)
    Output: "Oct 15, 2025 at 10:30 AM"
*/
function formatTimestamp(timestamp) {
    if (!timestamp) {
        return 'Date unknown';
    }

    /*
        Convert timestamp string to number
        Timestamps are stored as strings in filenames
        We need to convert to number for Date object
    */
    const timestampNum = parseInt(timestamp, 10);

    // Check if conversion was successful
    if (isNaN(timestampNum)) {
        return 'Date unknown';
    }

    /*
        Create a Date object from the timestamp
        JavaScript Date object provides many formatting methods
    */
    const date = new Date(timestampNum);

    /*
        Format the date using toLocaleString
        This respects user's locale settings (language/region)

        Options object customizes the output:
        - year: numeric (2025)
        - month: short (Oct)
        - day: numeric (15)
        - hour: numeric (10)
        - minute: numeric (30)
        - hour12: true (AM/PM format)
    */
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

/*
    Alternative: Create Image Card with Loading Placeholder

    This function creates a card that shows a loading skeleton
    while the real content is being fetched

    Useful for showing immediate feedback while images load
*/
export function createLoadingCard() {
    const card = document.createElement('article');
    card.className = 'image-card loading-card';

    // Create skeleton/placeholder elements
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container skeleton';

    const info = document.createElement('div');
    info.className = 'image-info';

    // Placeholder for name
    const namePlaceholder = document.createElement('div');
    namePlaceholder.className = 'skeleton-text';

    // Placeholder for meta
    const metaPlaceholder = document.createElement('div');
    metaPlaceholder.className = 'skeleton-text short';

    info.appendChild(namePlaceholder);
    info.appendChild(metaPlaceholder);

    card.appendChild(imageContainer);
    card.appendChild(info);

    return card;
}

/*
    CSS for loading skeleton (add to style.css if you want to use createLoadingCard):

    .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }

    .skeleton-text {
        height: 1rem;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }

    .skeleton-text.short {
        width: 60%;
    }

    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
*/
