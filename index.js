const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAAGnUvcuVawBOZBUHzEOooLTz4yn5BydPj8F4SqHlxcXfNqX5iVB4lo5iZC0VHtP0KZCsHS4pW3ImBcw5pAlbXHkt3SLdjnZA38kiMsUCyi7OupXEezr7sbdZAXCLxIZAu1fcaZAZCbmfyPBH354ZAkaWt7d8FNuSi6PDhXdST0FgfsFM1ouFvAcVZCsPvgrJhWzeLRwZDZD';

app.listen(process.env.PORT || 1337, () => {
    console.log('Server is running.');
});

// Verifying webhook
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Handling messages
app.post('/webhook', (req, res) => {
    const body = req.body;
    //irgendwas 

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            const webhook_event = entry.messaging[0];
            console.log(webhook_event);

            const sender_psid = webhook_event.sender.id;
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

function handleMessage(sender_psid, received_message) {
    let response;

    if (received_message.text) {
        response = {
            "text": `You sent the message: "${received_message.text}". Now send me an image!`
        };
    }

    callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
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
            console.log('message sent!');
        } else {
            console.error('Unable to send message:' + err);
        }
    });
}
