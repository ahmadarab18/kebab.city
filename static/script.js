const stripe = Stripe('your_publishable_key'); // Replace with your Stripe publishable key
let cart = [];
let cartCounter = document.querySelector('.cart-counter');

// Pexels API configuration
const PEXELS_API_KEY = 'NUHu5wJezeTQ8F5aKLIzd35ubomomkZZoEYYu7T63FBhWGsXP7zK76aI'; // Replace with your actual Pexels API key
const PEXELS_API_URL = 'https://api.pexels.com/videos/search';

// Function to fetch a random food-related video from Pexels
async function fetchPexelsVideo() {
    try {
        const searchQuery = 'cooking food restaurant kitchen';
        const response = await fetch(`${PEXELS_API_URL}?query=${searchQuery}&per_page=15&orientation=landscape`, {
            headers: {
                'Authorization': PEXELS_API_KEY
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch video from Pexels');
        }

        const data = await response.json();
        
        // Filter videos that have HD or Full HD files
        const suitableVideos = data.videos.filter(video => {
            return video.video_files.some(file => 
                (file.quality === 'hd' || file.quality === 'full_hd') && 
                file.width >= 1920
            );
        });

        if (suitableVideos.length === 0) {
            throw new Error('No suitable videos found');
        }

        // Select a random video from the filtered list
        const randomVideo = suitableVideos[Math.floor(Math.random() * suitableVideos.length)];
        
        // Get the highest quality video file
        const videoFile = randomVideo.video_files.reduce((prev, current) => {
            if (!prev || (current.width > prev.width && current.quality !== 'sd')) {
                return current;
            }
            return prev;
        });

        return videoFile.link;
    } catch (error) {
        console.error('Error fetching Pexels video:', error);
        return null;
    }
}

// Function to set up the video background
async function setupVideoBackground() {
    const videoElement = document.getElementById('hero-video');
    if (!videoElement) return;

    try {
        const videoUrl = await fetchPexelsVideo();
        if (!videoUrl) {
            throw new Error('No video URL available');
        }

        videoElement.src = videoUrl;
        
        // Event listeners for video
        videoElement.addEventListener('loadeddata', () => {
            videoElement.play();
        });

        videoElement.addEventListener('error', (e) => {
            console.error('Error loading video:', e);
            // You might want to add a fallback background here
        });

    } catch (error) {
        console.error('Error setting up video background:', error);
        // Fallback to a static background or default video
    }
}

// Cart Functions
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;
    
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item d-flex justify-content-between align-items-center mb-2';
        itemElement.innerHTML = `
            <span>${item.name}</span>
            <div class="quantity-controls">
                <button class="btn btn-sm btn-outline-secondary me-2" onclick="decreaseQuantity(${index})">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="increaseQuantity(${index})">+</button>
                <button class="btn btn-sm btn-danger ms-3" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = total.toFixed(2);
    updateCartCounter();
}

function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        if (totalItems > 0) {
            cartCounter.style.display = 'inline-block';
            cartCounter.classList.add('badge', 'bg-danger', 'rounded-pill');
        } else {
            cartCounter.style.display = 'none';
        }
    }
}

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showToast(`${name} added to cart!`);
}

function increaseQuantity(index) {
    if (index >= 0 && index < cart.length) {
        cart[index].quantity += 1;
        updateCartDisplay();
    }
}

function decreaseQuantity(index) {
    if (index >= 0 && index < cart.length) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        updateCartDisplay();
    }
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        updateCartDisplay();
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Order Type Handling
function handleOrderTypeChange() {
    const deliveryDetails = document.getElementById('deliveryDetails');
    const isDelivery = document.getElementById('delivery').checked;
    
    if (deliveryDetails) {
        deliveryDetails.style.display = isDelivery ? 'block' : 'none';
        
        // Toggle required attributes on delivery form fields
        const requiredFields = deliveryDetails.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.required = isDelivery;
        });
    }
}

// Checkout Handling
function handleCheckout() {
    const isDelivery = document.getElementById('delivery').checked;
    
    if (isDelivery) {
        // Validate delivery details
        const requiredFields = document.querySelectorAll('#deliveryDetails [required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
            }
        });
        
        if (!isValid) {
            showToast('Please fill in all delivery details');
            return;
        }
    }
    
    // Process the order
    const orderDetails = {
        items: cart,
        total: parseFloat(document.getElementById('cart-total').textContent),
        orderType: isDelivery ? 'delivery' : 'collection',
        deliveryDetails: isDelivery ? {
            name: document.getElementById('deliveryName').value,
            mobile: document.getElementById('deliveryMobile').value,
            postcode: document.getElementById('deliveryPostcode').value,
            doorNumber: document.getElementById('deliveryDoorNumber').value
        } : null
    };
    
    console.log('Processing order:', orderDetails);
    showToast('Order submitted successfully!');
    
    // Clear cart and close modal
    cart = [];
    updateCartDisplay();
    const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    if (modal) modal.hide();
}

document.addEventListener('DOMContentLoaded', () => {
    setupVideoBackground();
    
    // Initialize cart display
    updateCartDisplay();
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));
            addToCart(id, name, price);
        });
    });
    
    // Order type change handler
    const orderTypeInputs = document.querySelectorAll('input[name="orderType"]');
    orderTypeInputs.forEach(input => {
        input.addEventListener('change', handleOrderTypeChange);
    });
    
    // Checkout button handler
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
    
    // Refresh video periodically
    setInterval(setupVideoBackground, 30 * 60 * 1000);
});

// Add toast container if it doesn't exist
const style = document.createElement('style');
style.textContent = `
    .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }
    .toast {
        background-color: white;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(style);

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

// Load YouTube Player API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// YouTube Player API implementation
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: 'vwj5Q4QoHzk', // Professional food preparation video
        playerVars: {
            autoplay: 1,
            loop: 1,
            controls: 0,
            showinfo: 0,
            rel: 0,
            enablejsapi: 1,
            modestbranding: 1,
            iv_load_policy: 3,
            mute: 1,
            playlist: 'vwj5Q4QoHzk' // Required for looping
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();
    // Set video quality to high definition
    player.setPlaybackQuality('hd1080');
}

function onPlayerStateChange(event) {
    // If video ends, replay
    if (event.data === YT.PlayerState.ENDED) {
        player.playVideo();
    }
}

// Adjust player size on window resize
window.addEventListener('resize', function() {
    const videoBackground = document.querySelector('.video-background');
    if (videoBackground && player) {
        const width = videoBackground.offsetWidth;
        const height = videoBackground.offsetHeight;
        const aspectRatio = 16/9;
        
        let newWidth = width;
        let newHeight = width / aspectRatio;
        
        if (newHeight < height) {
            newHeight = height;
            newWidth = height * aspectRatio;
        }
        
        player.setSize(newWidth, newHeight);
    }
});

// Handle hero video
const heroVideo = document.getElementById('heroVideo');
    
if (heroVideo) {
    // Handle video loading error
    heroVideo.addEventListener('error', function(e) {
        console.log('Error loading video, falling back to background image');
        heroVideo.style.display = 'none';
    });

    // Ensure video is playing
    heroVideo.play().catch(function(error) {
        console.log('Video autoplay failed:', error);
    });
}

// Checkout button
document.getElementById('checkoutBtn').addEventListener('click', async function() {
    const orderType = document.querySelector('input[name="orderType"]:checked').value;
    
    if (orderType === 'delivery') {
        // Validate delivery details
        const deliveryName = document.getElementById('deliveryName').value;
        const deliveryMobile = document.getElementById('deliveryMobile').value;
        const deliveryPostcode = document.getElementById('deliveryPostcode').value;
        const deliveryDoorNumber = document.getElementById('deliveryDoorNumber').value;
        
        if (!deliveryName || !deliveryMobile || !deliveryPostcode || !deliveryDoorNumber) {
            alert('Please fill in all delivery details');
            return;
        }
    }
    
    // Proceed with payment
    try {
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: cart,
                orderType: orderType,
                deliveryDetails: orderType === 'delivery' ? {
                    name: document.getElementById('deliveryName').value,
                    mobile: document.getElementById('deliveryMobile').value,
                    postcode: document.getElementById('deliveryPostcode').value,
                    doorNumber: document.getElementById('deliveryDoorNumber').value
                } : null
            })
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement('card'),
                    billing_details: {
                        name: orderType === 'delivery' ? document.getElementById('deliveryName').value : ''
                    }
                }
            });
            
            if (result.error) {
                alert(result.error.message);
            } else {
                // Payment successful
                cart = [];
                updateCartDisplay();
                updateCartCounter();
                alert('Payment successful! Your order has been placed.');
                $('#cartModal').modal('hide');
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('There was an error processing your payment. Please try again.');
    }
});

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install button
    showInstallButton();
});

function showInstallButton() {
    // Create install button if it doesn't exist
    if (!document.getElementById('installButton')) {
        const installButton = document.createElement('button');
        installButton.id = 'installButton';
        installButton.className = 'btn btn-primary position-fixed bottom-0 end-0 m-4';
        installButton.innerHTML = '<i class="fas fa-download me-2"></i>Install App';
        installButton.style.zIndex = '1000';
        document.body.appendChild(installButton);

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                // We no longer need the prompt. Clear it up
                deferredPrompt = null;
                // Hide the install button
                installButton.style.display = 'none';
            }
        });
    }
}

// Hide the install button when the PWA is installed
window.addEventListener('appinstalled', (evt) => {
    if (document.getElementById('installButton')) {
        document.getElementById('installButton').style.display = 'none';
    }
});
