// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(bodyParser.json());

let customers = [];
let orders = [];
let communicationsLog = [];

// API to ingest customer data
app.post('/api/customers', (req, res) => {
  const customer = { id: uuidv4(), ...req.body };
  customers.push(customer);
  res.status(201).send(customer);
});

// API to ingest orders data
app.post('/api/orders', (req, res) => {
  const order = { id: uuidv4(), ...req.body };
  orders.push(order);
  res.status(201).send(order);
});

// API to create audience
app.post('/api/audience', (req, res) => {
  const rules = req.body;
  const audience = customers.filter(customer => {
    let match = true;
    if (rules.totalSpends) {
      const totalSpends = orders.filter(order => order.customerId === customer.id).reduce((sum, order) => sum + order.amount, 0);
      match = match && totalSpends > rules.totalSpends;
    }
    if (rules.maxVisits) {
      const visits = orders.filter(order => order.customerId === customer.id).length;
      match = match && visits <= rules.maxVisits;
    }
    if (rules.notVisitedInMonths) {
      const lastVisit = new Date(Math.max(...orders.filter(order => order.customerId === customer.id).map(order => new Date(order.date))));
      const monthsDifference = (new Date() - lastVisit) / (1000 * 60 * 60 * 24 * 30);
      match = match && monthsDifference > rules.notVisitedInMonths;
    }
    return match;
  });

  res.send({ audienceSize: audience.length, audience });
});

// API to send campaign
app.post('/api/send-campaign', (req, res) => {
  const audience = req.body.audience;
  audience.forEach(customer => {
    const logEntry = { id: uuidv4(), customerId: customer.id, status: Math.random() > 0.1 ? 'SENT' : 'FAILED' };
    communicationsLog.push(logEntry);
    setTimeout(() => {
      logEntry.status = Math.random() > 0.1 ? 'SENT' : 'FAILED';
    }, 1000);
  });
  res.status(200).send('Campaign Sent');
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
