const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Example mapping endpoint for OTA Hotel
app.post('/map/hotel', (req, res) => {
  // TODO: Implement mapping logic from internal to OTA Hotel schema
  const mapped = {
    OTA_HotelName: req.body.name,
    OTA_Address: req.body.address,
    // ...map other fields
  };
  res.json(mapped);
});

// Example mapping endpoint for OTA Airline
app.post('/map/airline', (req, res) => {
  // TODO: Implement mapping logic from internal to OTA Airline schema
  const mapped = {
    OTA_AirlineCode: req.body.code,
    OTA_AirlineName: req.body.name,
    // ...map other fields
  };
  res.json(mapped);
});

// Example mapping endpoint for OTA Car
app.post('/map/car', (req, res) => {
  // TODO: Implement mapping logic from internal to OTA Car schema
  const mapped = {
    OTA_CarType: req.body.type,
    OTA_CarModel: req.body.model,
    // ...map other fields
  };
  res.json(mapped);
});

app.listen(3011, () => {
  console.log('Automapper service running on port 3011');
});
