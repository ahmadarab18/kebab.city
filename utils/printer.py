from escpos.printer import Usb
from datetime import datetime
import json
import os

class ReceiptPrinter:
    def __init__(self):
        # USB printer settings (you'll need to update these values based on your printer)
        self.vendor_id = 0x0456    # Replace with your printer's vendor ID
        self.product_id = 0x0808   # Replace with your printer's product ID
        
        # Alternatively, for network printer
        # self.printer = Network("192.168.1.100")  # Replace with your printer's IP
        
    def print_order(self, order_data):
        try:
            # Initialize printer
            printer = Usb(self.vendor_id, self.product_id)
            
            # Print header
            printer.set(align='center', font='a', width=2, height=2)
            printer.text("City Kebab & Pizza\n")
            printer.set(align='center', font='a', width=1, height=1)
            printer.text("Order Receipt\n")
            printer.text(f"Order #{order_data['order_id']}\n")
            printer.text(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            printer.text("-" * 32 + "\n")
            
            # Print order type
            printer.set(align='left')
            printer.text(f"Order Type: {order_data['order_type'].upper()}\n")
            
            # Print delivery details if applicable
            if order_data['order_type'] == 'delivery':
                printer.text("\nDelivery Details:\n")
                printer.text(f"Name: {order_data['delivery_details']['name']}\n")
                printer.text(f"Address: {order_data['delivery_details']['address']}\n")
                printer.text(f"Phone: {order_data['delivery_details']['phone']}\n")
            
            # Print items
            printer.text("\nOrder Items:\n")
            printer.text("-" * 32 + "\n")
            total = 0
            for item in order_data['items']:
                price = float(item['price']) * int(item['quantity'])
                total += price
                printer.text(f"{item['quantity']}x {item['name']}\n")
                printer.text(f"   ${price:.2f}\n")
            
            # Print total
            printer.text("-" * 32 + "\n")
            printer.set(align='right')
            printer.text(f"Total: ${total:.2f}\n")
            
            # Print footer
            printer.set(align='center')
            printer.text("\nThank you for your order!\n")
            printer.text("www.citykebab.com\n")
            
            # Cut paper
            printer.cut()
            
        except Exception as e:
            print(f"Printing error: {str(e)}")
            # You might want to implement error notification here
            
    def test_print(self):
        """Test printer connection with a simple receipt"""
        try:
            printer = Usb(self.vendor_id, self.product_id)
            printer.text("Printer Test\n")
            printer.text("Connection Successful!\n")
            printer.cut()
            return True
        except Exception as e:
            print(f"Printer test failed: {str(e)}")
            return False
