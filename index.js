require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running.');
});

// Verifying webhook
app.get('/webhook', (req, res) => {
    console.log('------------ Webhook GET Request ------------');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query parameters:', JSON.stringify(req.query, null, 2));
  
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
  
    console.log(`Mode: ${mode}`);
    console.log(`Token: ${token}`);
    console.log(`Challenge: ${challenge}`);
    console.log(`VERIFY_TOKEN from env: ${VERIFY_TOKEN}`);
  
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.log('Verification failed');
            res.sendStatus(403);
        }
    } else {
        console.log('Missing mode or token');
        res.sendStatus(400);
    }
    console.log('------------ End of Webhook GET Request ------------');
});

// Handling messages
app.post('/webhook', (req, res) => {
    console.log('------------ Webhook POST Request ------------');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
  
    const body = req.body;
  
    if (body.object === 'page') {
        body.entry.forEach(entry => {
            const webhook_event = entry.messaging[0];
            console.log('Webhook event:', JSON.stringify(webhook_event, null, 2));
            
            const sender_psid = webhook_event.sender.id;
            console.log('Sender PSID:', sender_psid);
    
            if (webhook_event.message) {
            handleMessage(sender_psid, webhook_event.message);
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        console.log('Received object is not a page');
        res.sendStatus(404);
    }
    console.log('------------ End of Webhook POST Request ------------');
});

function handleMessage(sender_psid, received_message) {
    console.log('------------ Handling Message ------------');
    console.log('Sender PSID:', sender_psid);
    console.log('Received message:', JSON.stringify(received_message, null, 2));
  
    let response;
    if (received_message.text) {
        response = {
            "text": `You sent the message: "${received_message.text}". Now send me an image!`
        };
    }
  
    console.log('Sending response:', JSON.stringify(response, null, 2));
    callSendAPI(sender_psid, response);
    console.log('------------ End of Handling Message ------------');
}

function callSendAPI(sender_psid, response) {
    console.log('------------ Calling Send API ------------');
    console.log('Sender PSID:', sender_psid);
    console.log('Response:', JSON.stringify(response, null, 2));
  
    const request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
  
    request({
        "uri": "https://graph.facebook.com/v9.0/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('Message sent successfully');
        } else {
            console.error('Unable to send message:', err);
        }
        console.log('------------ End of Calling Send API ------------');
    });
}

module.exports = app;