const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

// Endpoint for Dialogflow webhook
app.post('/webhook', async (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;

  if (intentName === 'Order Tracking') {
    const orderNumber = req.body.queryResult.parameters['order-number'];

    try {
      // Fetch order tracking data from a free tracking API (Ship24)
      const orderDetails = await trackOrder(orderNumber);

      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `Your order #${orderNumber} is currently **${orderDetails.status}**. The last update was on **${orderDetails.last_update}**. Estimated delivery: **${orderDetails.estimated_delivery}**.`
              ]
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error in Order Tracking:', error.message);
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: ['Sorry, I could not retrieve your order details. Please check the order number and try again.']
            }
          }
        ]
      });
    }
  } else if (intentName === 'Product Information') {
    const productName = req.body.queryResult.parameters['product-name'];

    try {
      // Fetch product information from a free API (FakeStoreAPI)
      const productInfo = await getProductInfo(productName);

      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `Here’s what I found about **${productName}**: ${productInfo.description}. Key features: ${productInfo.features}. Price: **${productInfo.price} USD**.`
              ]
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error in Product Information:', error.message);
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: ['Sorry, I couldn’t find information about that product. Please try again later.']
            }
          }
        ]
      });
    }
  }
});

// Function to fetch order tracking details
const trackOrder = async (orderNumber) => {
  const apiKey = 'apik_5gDzmUXlGEH2XHjf06NdeERATXR50L'; // Replace with your Ship24 API key
  const apiUrl = `https://api.ship24.com/public/v1/trackers/${orderNumber}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const trackingData = response.data.data[0]; // Assuming the first entry contains details
      return {
        status: trackingData.status || 'Unknown',
        last_update: trackingData.lastEventDate || 'Not available',
        estimated_delivery: trackingData.estimatedDeliveryDate || 'Not available'
      };
    } else {
      throw new Error('No tracking details found.');
    }
  } catch (error) {
    throw new Error(`Error fetching order details: ${error.message}`);
  }
};

// Function to fetch product information
const getProductInfo = async (productName) => {
  const apiUrl = `https://fakestoreapi.com/products`; // Free API for product information

  try {
    const response = await axios.get(apiUrl);
    const products = response.data;

    // Filter products based on product name
    const product = products.find((p) =>
      p.title.toLowerCase().includes(productName.toLowerCase())
    );

    if (product) {
      return {
        description: product.description,
        features: product.category,
        price: product.price
      };
    } else {
      throw new Error('Product not found.');
    }
  } catch (error) {
    throw new Error(`Error fetching product information: ${error.message}`);
  }
};

app.listen(port, () => {
  console.log(`Webhook server is running on port ${port}`);
});
