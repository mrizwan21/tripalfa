import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

interface HotelRequest {
  name?: string;
  address?: string;
}

interface AirlineRequest {
  code?: string;
  name?: string;
}

interface CarRequest {
  type?: string;
  model?: string;
}

// Example mapping endpoint for OTA Hotel
app.post("/map/hotel", (req: Request, res: Response): void => {
  const body: HotelRequest = req.body;
  // TODO: Implement mapping logic from internal to OTA Hotel schema
  const mapped = {
    OTA_HotelName: body.name,
    OTA_Address: body.address,
    // ...map other fields
  };
  res.json(mapped);
});

// Example mapping endpoint for OTA Airline
app.post("/map/airline", (req: Request, res: Response): void => {
  const body: AirlineRequest = req.body;
  // TODO: Implement mapping logic from internal to OTA Airline schema
  const mapped = {
    OTA_AirlineCode: body.code,
    OTA_AirlineName: body.name,
    // ...map other fields
  };
  res.json(mapped);
});

// Example mapping endpoint for OTA Car
app.post("/map/car", (req: Request, res: Response): void => {
  const body: CarRequest = req.body;
  // TODO: Implement mapping logic from internal to OTA Car schema
  const mapped = {
    OTA_CarType: body.type,
    OTA_CarModel: body.model,
    // ...map other fields
  };
  res.json(mapped);
});

app.listen(3011, () => {
  console.log("Automapper service running on port 3011");
});
