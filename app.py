from flask import Flask, render_template, request, jsonify
import stripe
import os
from dotenv import load_dotenv
import requests

load_dotenv()

app = Flask(__name__)
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY', 'YOUR_UNSPLASH_ACCESS_KEY')

def get_unsplash_image(query):
    url = f"https://api.unsplash.com/search/photos"
    headers = {
        "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
    }
    params = {
        "query": query,
        "per_page": 1,
        "orientation": "landscape"
    }
    try:
        response = requests.get(url, headers=headers, params=params)
        print(f"Unsplash API response for {query}:", response.status_code)  # Debug print
        if response.status_code == 200:
            data = response.json()
            if data["results"]:
                image_url = data["results"][0]["urls"]["regular"]
                print(f"Found image URL for {query}:", image_url)  # Debug print
                return image_url
        print(f"No image found for {query}")  # Debug print
        return None
    except Exception as e:
        print(f"Error fetching image for {query}:", str(e))  # Debug print
        return None

# Menu items with dynamic images
MENU = {
    'pizzas': [
        {'id': 'pizza-margherita', 'name': 'Margherita Pizza', 'price': 12.99, 
         'description': 'Classic tomato sauce, mozzarella, and basil',
         'image': get_unsplash_image('margherita pizza')},
        {'id': 'pizza-pepperoni', 'name': 'Pepperoni Pizza', 'price': 14.99, 
         'description': 'Tomato sauce, mozzarella, and pepperoni',
         'image': get_unsplash_image('pepperoni pizza')},
        {'id': 'pizza-veggie', 'name': 'Vegetarian Pizza', 'price': 13.99, 
         'description': 'Tomato sauce, mozzarella, mushrooms, peppers, and onions',
         'image': get_unsplash_image('vegetarian pizza')}
    ],
    'kebabs': [
        {'id': 'kebab-chicken', 'name': 'Chicken Kebab', 'price': 9.99, 
         'description': 'Grilled chicken with salad and sauce',
         'image': get_unsplash_image('chicken kebab')},
        {'id': 'kebab-lamb', 'name': 'Lamb Kebab', 'price': 11.99, 
         'description': 'Grilled lamb with salad and sauce',
         'image': get_unsplash_image('lamb kebab')},
        {'id': 'kebab-mixed', 'name': 'Mixed Kebab', 'price': 12.99, 
         'description': 'Chicken and lamb with salad and sauce',
         'image': get_unsplash_image('mixed kebab')}
    ],
    'burgers': [
        {'id': 'burger-classic', 'name': 'Classic Burger', 'price': 8.99, 
         'description': 'Beef patty with lettuce, tomato, and cheese',
         'image': get_unsplash_image('classic burger')},
        {'id': 'burger-chicken', 'name': 'Chicken Burger', 'price': 8.99, 
         'description': 'Grilled chicken with lettuce and mayo',
         'image': get_unsplash_image('chicken burger')},
        {'id': 'burger-veggie', 'name': 'Veggie Burger', 'price': 8.99, 
         'description': 'Plant-based patty with lettuce and tomato',
         'image': get_unsplash_image('veggie burger')}
    ]
}

# Also get a hero image
HERO_IMAGE = get_unsplash_image('restaurant food display') or '/static/images/hero-bg.jpg'

@app.route('/')
def index():
    return render_template('index.html', menu=MENU, hero_image=HERO_IMAGE)

@app.route('/create-payment-intent', methods=['POST'])
def create_payment():
    try:
        data = request.json
        intent = stripe.PaymentIntent.create(
            amount=int(float(data['amount']) * 100),  # Convert to cents
            currency='usd',
            metadata={
                'order_type': data['order_type'],  # delivery or collection
                'address': data.get('address', '')
            }
        )
        return jsonify({
            'clientSecret': intent.client_secret
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
