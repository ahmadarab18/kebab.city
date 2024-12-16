# Food Shop Online Ordering System

A web application for a food shop that allows customers to order pizzas, kebabs, and burgers online with options for collection and delivery.

## Features

- Browse menu items with descriptions and prices
- Add items to cart with quantity control
- Choose between collection and delivery
- Secure online payment processing with Stripe
- Responsive design for all devices

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Add your Stripe API keys to the `.env` file:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`

3. Update the Stripe publishable key in `static/script.js`

4. Run the application:
```bash
python app.py
```

5. Visit `http://localhost:5000` in your web browser

## Technology Stack

- Backend: Python/Flask
- Frontend: HTML, CSS, JavaScript
- Payment Processing: Stripe
- Styling: Bootstrap 5

## Security

- Sensitive information is stored in environment variables
- Stripe handles all payment processing securely
- No credit card information is stored on the server
