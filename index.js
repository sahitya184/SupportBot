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
      // Fetch order tracking data from the AfterShip API
      const orderDetails = await trackOrder(orderNumber);
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `Your order #${orderNumber} is currently ${orderDetails.status} and will arrive on ${orderDetails.delivery_date}.`
              ]
            }
          }
        ]
      });
    } catch (error) {
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: ['Sorry, I could not retrieve your order details. Please try again later.']
            }
          }
        ]
      });
    }
  } else if (intentName === 'Product Information') {
    const productName = req.body.queryResult.parameters['product-name'];
    try {
      // Fetch product information from the Open Product Data API
      const productInfo = await getProductInfo(productName);
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `The product you're asking about is a ${productName}. It has the following features: ${productInfo.features.join(', ')}.`
              ]
            }
          }
        ]
      });
    } catch (error) {
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
  const apiKey = 'asat_b3355513a65f49f3b90452475c89ba27'; // Replace with your Aftership API key
  const apiUrl = `https://api.aftership.com/v4/trackings/${orderNumber}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'aftership-api-key': apiKey
      }
    });
    return response.data.data.tracking;
  } catch (error) {
    throw new Error('Error fetching order details');
  }
};

// Function to fetch product information
const getProductInfo = async (productName) => {
  const apiUrl = `https://api.openproductdata.com/products/${productName}`; // Example API endpoint

  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    throw new Error('Error fetching product information');
  }
};

app.listen(port, () => {
  console.log(`Webhook server is running on port ${port}`);
});
