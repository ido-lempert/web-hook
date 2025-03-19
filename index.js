const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const xhub = require('express-x-hub');

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(bodyParser.json());

const token = process.env.TOKEN || 'token';
const received_updates = [];
const leads = [];

app.get('/', function(req, res) {
    // console.log(req);
    res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre><hr><pr>' + JSON.stringify(leads, null, 2) + '</pr>');
});

app.get(['/facebook', '/instagram', '/threads'], function(req, res) {
    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == token
    ) {
        res.send(req.query['hub.challenge']);
    } else {
        res.sendStatus(400);
    }
});

function getLead(data){
    const accessToken = process.env.ACCESS_TOKEN;
    fetch(`https://graph.facebook.com/v22.0/${data.entry[0].changes[0].value.leadgen_id}?fields=id,ad_id,form_id,created_time,field_data&access_token=${accessToken}`).then(async res => {
        leads.unshift(await res.json());
    }, err => console.error(err));
}

app.post('/facebook', function(req, res) {
    console.log('Facebook request body:', req.body);

    if (!req.isXHubValid()) {
        console.log('Warning - request header X-Hub-Signature not present or invalid');
        res.sendStatus(401);
        return;
    }

    console.log('request header X-Hub-Signature validated');
    // Process the Facebook updates here
    received_updates.unshift(req.body);
    getLead(res.body);
    res.sendStatus(200);
});

app.post('/instagram', function(req, res) {
    console.log('Instagram request body:');
    console.log(req.body);
    // Process the Instagram updates here
    received_updates.unshift(req.body);
    res.sendStatus(200);
});

app.post('/threads', function(req, res) {
    console.log('Threads request body:');
    console.log(req.body);
    // Process the Threads updates here
    received_updates.unshift(req.body);
    res.sendStatus(200);
});

app.listen();