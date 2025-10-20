/*
    Image Grid Component
    Manages the gallery display of all images

    This component demonstrates:
    1. Managing multiple child components (image cards)
    2. Handling loading and empty states
    3. Updating the UI based on data
    4. Component composition (grid contains cards)
*/

// Import the imageCard component
// This is an example of component composition - one component using another
import { createImageCard, createLoadingCard } from './imageCard.js';

/*
    Factory Function: createImageGrid

    Creates a container that displays a grid of images
    Handles loading states and empty states

    Parameters:
    - options: Object with configuration
        - images: Array of image data objects
        - onRefresh: Callback function to refresh the gallery
        - isLoading: Boolean indicating if data is being loaded

    Returns:
    - A DOM element containing the image grid
*/
export function createImageGrid(options = {}) {
    // Destructure options with default values
    const {
        images = [],          // Default to empty array if no images provided
        onRefresh = null,     // Optional refresh callback
        isLoading = false     // Default to not loading
    } = options;

    /*
        Create the grid container
        This will hold all the image cards in a CSS Grid layout
    */
    const gridContainer = document.createElement('div');
    gridContainer.className = 'image-grid';

    /*
        Handle different states:
        1. Loading state - show loading indicators
        2. Empty state - show "no images" message
        3. Normal state - show image grid
    */

    if (isLoading) {
        // Show loading state
        renderLoadingState(gridContainer);
    } else if (images.length === 0) {
        // Show empty state
        renderEmptyState(gridContainer);
    } else {
        // Show images
        renderImages(gridContainer, images);
    }

    return gridContainer;
}

/*
    Render Loading State
    Shows placeholder cards while images are being fetched

    This provides immediate visual feedback to users
    Better UX than showing nothing while data loads
*/
function renderLoadingState(container) {
    /*
        Create multiple loading cards
        We show 6 placeholder cards to fill the grid nicely
        These are "skeleton screens" - a modern UX pattern
    */
    const loadingCardsCount = 6;

    for (let i = 0; i < loadingCardsCount; i++) {
        const loadingCard = createLoadingCard();
        container.appendChild(loadingCard);
    }

    console.log('Showing loading state...');
}

/*
    Render Empty State
    Shows a friendly message when no images exist

    This is better than showing nothing - it tells users
    what to do next (upload an image)
*/
function renderEmptyState(container) {
    /*
        Create empty state container
        This is centered and styled to be friendly and helpful
    */
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    // Icon
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = '';
    icon.setAttribute('aria-hidden', 'true'); // Hide decorative icon from screen readers

    // Message
    const message = document.createElement('p');
    message.textContent = 'No images yet';

    // Subtext with instructions
    const subtext = document.createElement('p');
    subtext.textContent = 'Upload your first image to get started';
    subtext.style.fontSize = '0.9rem';
    subtext.style.color = 'var(--text-secondary)';

    // Assemble empty state
    emptyState.appendChild(icon);
    emptyState.appendChild(message);
    emptyState.appendChild(subtext);

    container.appendChild(emptyState);

    console.log('No images to display');
}

/*
    Render Images
    Creates and displays image cards for all images

    This is where we use the imageCard component
    to create a card for each image in our array
*/
function renderImages(container, images) {
    /*
        Loop through all images and create cards
        We use forEach() which is a clean way to iterate through arrays

        For each image in the array:
        1. Create a card using the imageCard component
        2. Add the card to the grid container
    */
    images.forEach((imageData) => {
        // Create an image card for this image
        const card = createImageCard(imageData);

        // Add the card to the grid
        container.appendChild(card);
    });

    console.log(`Displayed ${images.length} image(s)`);
}

/*
    Update Grid Function
    Updates an existing grid with new data

    This is useful when images change (new upload, deletion, etc.)
    Instead of recreating the entire component, we update it in place

    Parameters:
    - gridElement: The existing grid DOM element to update
    - images: New array of image data
*/
export function updateImageGrid(gridElement, images) {
    /*
        Clear all existing content
        innerHTML = '' removes all child elements
        This is simpler than manually removing each child
    */
    gridElement.innerHTML = '';

    /*
        Re-render based on new data
        Same logic as createImageGrid, but updating existing element
    */
    if (images.length === 0) {
        renderEmptyState(gridElement);
    } else {
        renderImages(gridElement, images);
    }

    console.log('Grid updated');
}

/*
    Add Image to Grid Function
    Adds a single new image to existing grid

    This is more efficient than re-rendering the entire grid
    when you just need to add one new image (like after upload)

    Parameters:
    - gridElement: The existing grid DOM element
    - imageData: Data for the single image to add
*/
export function addImageToGrid(gridElement, imageData) {
    /*
        Check if grid is showing empty state
        If it is, we need to clear it first
    */
    const emptyState = gridElement.querySelector('.empty-state');
    if (emptyState) {
        // Remove empty state message
        gridElement.innerHTML = '';
    }

    /*
        Create card for the new image
        We could add it at the beginning or end
        Adding at beginning (prepend) shows newest images first
    */
    const card = createImageCard(imageData);

    // Add to the beginning of the grid (newest first)
    // Alternative: gridElement.appendChild(card) would add to end
    gridElement.insertBefore(card, gridElement.firstChild);

    console.log(`Added new image: ${imageData.name}`);

    /*
        Optional: Add animation for new card
        You could add a class that triggers a CSS animation
        card.classList.add('new-card-animation');
    */
}

/*
    Create Grid with Refresh Button
    Alternative version that includes a refresh button

    Useful for manual refreshing of the gallery
*/
export function createImageGridWithRefresh(options = {}) {
    const { images = [], onRefresh, isLoading = false } = options;

    // Create wrapper for grid and controls
    const wrapper = document.createElement('div');
    wrapper.className = 'grid-wrapper';

    // Create refresh button if callback provided
    if (onRefresh) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'btn btn-secondary refresh-button';
        refreshButton.textContent = 'Refresh Gallery';
        refreshButton.setAttribute('aria-label', 'Refresh image gallery');

        // Add click handler
        refreshButton.addEventListener('click', () => {
            console.log('Refresh requested');
            onRefresh();
        });

        wrapper.appendChild(refreshButton);
    }

    // Create and add the grid
    const grid = createImageGrid({ images, onRefresh, isLoading });
    wrapper.appendChild(grid);

    return wrapper;
}

/*
    Grid Statistics Function
    Returns useful statistics about the grid

    Useful for debugging or displaying info to users
*/
export function getGridStats(gridElement) {
    const imageCards = gridElement.querySelectorAll('.image-card:not(.loading-card)');
    const loadingCards = gridElement.querySelectorAll('.loading-card');
    const hasEmptyState = gridElement.querySelector('.empty-state') !== null;

    return {
        totalImages: imageCards.length,
        isLoading: loadingCards.length > 0,
        isEmpty: hasEmptyState,
        element: gridElement
    };
}

/*
    USAGE EXAMPLES:

    // Create a new grid
    const grid = createImageGrid({
        images: [
            { url: 'pic1.jpg', name: 'Photo 1', timestamp: '1234567890' },
            { url: 'pic2.jpg', name: 'Photo 2', timestamp: '1234567891' }
        ],
        isLoading: false
    });
    document.getElementById('container').appendChild(grid);

    // Update existing grid
    const newImages = [...]; // array of image data
    updateImageGrid(grid, newImages);

    // Add single image
    const newImage = { url: 'pic3.jpg', name: 'Photo 3', timestamp: '1234567892' };
    addImageToGrid(grid, newImage);

    // Get statistics
    const stats = getGridStats(grid);
    console.log(`Total images: ${stats.totalImages}`);
*/
