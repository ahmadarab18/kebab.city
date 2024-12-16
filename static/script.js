const stripe = Stripe('your_publishable_key'); // Replace with your Stripe publishable key
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const name = button.dataset.name;
            const price = parseFloat(button.dataset.price);
            
            addToCart(id, name, price);
            updateCartDisplay();
        });
    });

    // Order type selection
    document.getElementById('order-type').addEventListener('change', (e) => {
        const deliveryAddress = document.getElementById('delivery-address');
        if (e.target.value === 'delivery') {
            deliveryAddress.style.display = 'block';
        } else {
            deliveryAddress.style.display = 'none';
        }
    });

    // Checkout button
    document.getElementById('checkout-button').addEventListener('click', handleCheckout);
});

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <span class="cart-item-name">${item.name}</span>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
        cartItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = total.toFixed(2);
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(cartItem => cartItem.id !== id);
        }
        updateCartDisplay();
    }
}

async function handleCheckout() {
    const orderType = document.getElementById('order-type').value;
    const address = orderType === 'delivery' 
        ? document.querySelector('#delivery-address textarea').value 
        : '';

    if (orderType === 'delivery' && !address.trim()) {
        alert('Please enter a delivery address');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: total,
                order_type: orderType,
                address: address
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        const elements = stripe.elements();
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        const result = await stripe.confirmPayment({
            elements,
            clientSecret: data.clientSecret,
            confirmParams: {
                return_url: window.location.origin + '/order-complete',
            },
        });

        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        alert('Error processing payment: ' + error.message);
    }
}
