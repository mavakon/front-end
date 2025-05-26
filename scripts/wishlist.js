const users = [
    { username: "user1", password: "pass1" },
    { username: "user2", password: "pass2" }
];

let wishlistItems = [
    { name: "Socks", description: "Warm winter socks", category: "clothing" },
    { name: "Toy Helicopter", description: "Remote controlled helicopter", category: "toy" }
];

// DOM Elements
let loginForm;
let wishlistForm;
let itemNameInput;
let descriptionInput;
let categorySelect;
let wishlistContainer;
let loginContainer;
let wishlistSection;
let errorMessage;
let loginUsername;
let loginPassword;
let loggedInUser = null;

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loginContainer = document.getElementById('login-container');
    wishlistSection = document.getElementById('wishlist-section');
    loginForm = document.getElementById('login-form');
    wishlistForm = document.getElementById('wishlist-form');
    itemNameInput = document.getElementById('item');
    descriptionInput = document.getElementById('description');
    categorySelect = document.getElementById('category');
    wishlistContainer = document.getElementById('wishlist-items');
    errorMessage = document.getElementById('error-message');
    loginUsername = document.getElementById('username');
    loginPassword = document.getElementById('password');

    // Event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);

        loginUsername.addEventListener('blur', validateUsername);
    }

    if (wishlistForm) {
        wishlistForm.addEventListener('submit', handleWishlistSubmit);

        itemNameInput.addEventListener('input', validateItemName);

        categorySelect.addEventListener('change', updateFormBasedOnCategory);
    }

    displayWishlistItems();

    // Hide the wishlist section if login is required
    if (loginContainer && wishlistSection) {
        wishlistSection.style.display = 'none';
    }
});

function validateUsername() {
    const username = loginUsername.value.trim();

    if (username.length < 5) {
        showError('Username must be at least 5 characters long', loginUsername);
        return false;
    }

    clearError();
    return true;
}

function handleLogin(event) {
    event.preventDefault();

    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    // Clear previous errors
    clearError();

    // Validate username and password
    let hasErrors = false;

    if (!username) {
        showError('Please enter a username', loginUsername);
        hasErrors = true;
    }

    if (!password) {
        showError('Please enter a password', loginPassword);
        hasErrors = true;
    }

    if (hasErrors) {
        return;
    }

    // Check credentials against predefined users
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        loggedInUser = username;
        loginContainer.style.display = 'none';
        wishlistSection.style.display = 'block';
        showMessage(`Welcome, ${username}!`, 'success-message');
    } else {
        // Show invalid credentials error
        showError('Invalid password', loginPassword);
    }
}

function handleWishlistSubmit(event) {
    event.preventDefault();

    const name = itemNameInput.value.trim();
    const description = descriptionInput.value.trim();
    const category = categorySelect.value;

    // Clear previous errors
    clearError();

    // Validate item name
    if (!name) {
        showError('Please enter an item name', itemNameInput);
        return;
    }

    if (name.length < 3) {
        showError('Item name must be at least 3 characters long', itemNameInput);
        return;
    }

    wishlistItems.push({ name, description, category });

    wishlistForm.reset();

    displayWishlistItems();

    showMessage('Item added successfully!', 'success-message');
}

function validateItemName() {
    const name = itemNameInput.value.trim();

    if (name.length < 3) {
        showError('Item name must be at least 3 characters long', itemNameInput);
    } else {
        clearError();
    }
}

function updateFormBasedOnCategory() {
    const category = categorySelect.value;

    switch(category) {
        case 'toy':
            descriptionInput.placeholder = 'Describe the toy (age range, batteries required, etc.)';
            break;
        case 'book':
            descriptionInput.placeholder = 'Describe the book (author, genre, etc.)';
            break;
        case 'clothing':
            descriptionInput.placeholder = 'Describe the clothing (size, color, etc.)';
            break;
        default:
            descriptionInput.placeholder = 'Enter a description';
    }

    // Dispatching event on category change (future use)
    const categoryChangeEvent = new CustomEvent('categoryChanged', { 
        detail: { category: category }
    });
    document.dispatchEvent(categoryChangeEvent);
}

function displayWishlistItems() {
    if (!wishlistContainer) return;

    wishlistContainer.innerHTML = '';

    wishlistItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `wishlist-item ${item.category}`;

        const itemName = document.createElement('strong');
        itemName.textContent = item.name;

        const itemDescription = document.createElement('p');
        itemDescription.textContent = item.description || 'No description provided';

        const categoryBadge = document.createElement('span');
        categoryBadge.className = 'category-badge';
        categoryBadge.textContent = item.category;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => removeWishlistItem(index));

        li.appendChild(itemName);
        li.appendChild(itemDescription);
        li.appendChild(categoryBadge);
        li.appendChild(deleteButton);

        wishlistContainer.appendChild(li);
    });
}

function removeWishlistItem(index) {
    wishlistItems.splice(index, 1);
    displayWishlistItems();
    showMessage('Item removed from wishlist', 'success-message');
}

function showError(message, relatedElement = null) {
    if (!relatedElement) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.className = 'message-container error-message';
            errorMessage.style.display = 'block';
        }
        return;
    }

    relatedElement.classList.add('error');
    relatedElement.focus();

    const fieldId = relatedElement.id;
    const errorContainer = document.getElementById(`${fieldId}-error`);

    if (errorContainer) {
        // Display error in the field-specific container
        errorContainer.textContent = message;
    } else if (errorMessage) {
        // Fallback to main error container if field-specific container not found
        errorMessage.textContent = message;
        errorMessage.className = 'message-container error-message';
        errorMessage.style.display = 'block';
    }
}

function clearError() {
    // main error container
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }

    // field-specific error containers
    document.querySelectorAll('.field-error').forEach(el => {
        el.textContent = '';
    });

    // error class from all inputs
    document.querySelectorAll('.error').forEach(el => {
        el.classList.remove('error');
    });
}

function showMessage(message, className = 'error-message') {
    if (!errorMessage) return;

    errorMessage.textContent = message;
    errorMessage.className = `message-container ${className}`;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Logging category changes (for future use)
document.addEventListener('categoryChanged', (event) => {
    console.log(`Category changed to: ${event.detail.category}`);
});
