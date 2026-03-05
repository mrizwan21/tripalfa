import { Router, Request, Response, NextFunction } from "express";
import type { Router as ExpressRouter } from "express";
import multer from "multer";
import type { Express } from "express";
import path from "path";

type MulterFile = Express.Multer.File;

const router: ExpressRouter = Router();

// Extend inventory models for credit cards, preferences, loyalty programs
export interface LoyaltyProgram {
  id: string;
  name: string;
  points: number;
  tier?: string;
}

export interface UserPreferences {
  [key: string]: any;
}

export type InventoryUser = {
  id: string;
  name: string;
  userType: "B2B" | "B2C";
  creditCards?: string[];
  preferences?: UserPreferences;
  loyaltyPrograms?: LoyaltyProgram[];
  cars?: string[];
};

export type InventoryCompany = {
  id: string;
  name: string;
  creditCards?: string[];
  preferences?: UserPreferences;
  loyaltyPrograms?: LoyaltyProgram[];
};

export type RoomContract = {
  id: string;
  hotelId: string;
  roomId: string;
  contractType: "allocation" | "guarantee" | "dynamic" | " static";
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  terms?: string;
  createdBy?: string;
};

export type RoomType = {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  hotelId: string;
};

// Remove duplicate type/interface declarations (keep only one definition for each)
// Add missing RevenueBlock type
export interface RevenueBlock {
  id: string;
  hotelId: string;
  startDate: string;
  endDate: string;
  blockType: string;
  roomsBlocked: number;
  reason: string;
  createdBy: string;
}

// Add metadata property to InventoryItem interface
export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  location?: string;
  status: "active" | "inactive" | "out-of-stock";
  metadata?: Record<string, any>;
}

const revenueBlocks = [
  {
    id: "rb1",
    hotelId: "h1",
    startDate: "2026-01-21",
    endDate: "2026-01-23",
    blockType: "self-inventory",
    roomsBlocked: 10,
    reason: "Maintenance",
    createdBy: "admin1",
  },
  {
    id: "rb2",
    hotelId: "h2",
    startDate: "2026-01-25",
    endDate: "2026-01-28",
    blockType: "pre-blocking",
    roomsBlocked: 5,
    reason: "Group booking",
    createdBy: "admin2",
  },
];
// Revenue Blocks CRUD
router.get("/revenue-blocks", (req: Request, res: Response) => {
  const { hotelId, blockType, from, to } = req.query;
  let blocks = revenueBlocks;
  if (hotelId && typeof hotelId === "string")
    blocks = blocks.filter((b) => b.hotelId === hotelId);
  if (blockType && typeof blockType === "string")
    blocks = blocks.filter((b) => b.blockType === blockType);
  if (from && typeof from === "string")
    blocks = blocks.filter((b) => b.startDate >= from);
  if (to && typeof to === "string")
    blocks = blocks.filter((b) => b.endDate <= to);
  res.json(blocks);
});
router.post("/revenue-blocks", (req: Request, res: Response) => {
  const {
    hotelId,
    startDate,
    endDate,
    blockType,
    roomsBlocked,
    reason,
    createdBy,
  } = req.body;
  if (
    !hotelId ||
    !startDate ||
    !endDate ||
    !blockType ||
    typeof roomsBlocked !== "number"
  ) {
    return res.status(400).json({
      message: "hotelId, startDate, endDate, blockType, roomsBlocked required",
    });
  }
  const newBlock: RevenueBlock = {
    id: String(Date.now()),
    hotelId,
    startDate,
    endDate,
    blockType,
    roomsBlocked,
    reason,
    createdBy,
  };
  revenueBlocks.push(newBlock);
  res.status(201).json(newBlock);
});
router.put("/revenue-blocks/:id", (req: Request, res: Response) => {
  const block = revenueBlocks.find((b) => b.id === req.params.id);
  if (!block)
    return res.status(404).json({ message: "Revenue block not found" });
  Object.assign(block, req.body);
  res.json(block);
});
router.delete("/revenue-blocks/:id", (req: Request, res: Response) => {
  const idx = revenueBlocks.findIndex((b) => b.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ message: "Revenue block not found" });
  const deleted = revenueBlocks.splice(idx, 1)[0];
  res.json(deleted);
});
// Hotel model
export interface Hotel {
  id: string;
  name: string;
  address?: string;
  features?: string[];
  description?: string;
  images?: string[];
  videos?: string[];
}

// Room model
export interface Room {
  id: string;
  typeId: string;
  number: string;
  status: "available" | "occupied" | "maintenance";
  features?: string[];
  hotelId: string;
}

// Allocation model
export interface Allocation {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  status: "allocated" | "cancelled" | "completed";
  guestName?: string;
  bookingId?: string;
}

// Multer setup for hotel media uploads
const hotelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/hotels"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const hotelUpload = multer({ storage: hotelStorage });

// Mock data for demonstration
const inventory: InventoryItem[] = [
  {
    id: "i1",
    name: "Travel Backpack",
    description: "Durable backpack for travel",
    quantity: 25,
    location: "Warehouse A",
    status: "active",
    metadata: { color: "black", brand: "Nomad" },
  },
  {
    id: "i2",
    name: "Suitcase",
    description: "Large suitcase with wheels",
    quantity: 0,
    location: "Warehouse B",
    status: "out-of-stock",
    metadata: { color: "blue", brand: "TravelPro" },
  },
];

// GET /inventory - list all items, filter by name/location/status
router.get("/", (req: Request, res: Response) => {
  let items = inventory;
  const { name, location, status } = req.query;
  if (name && typeof name === "string") {
    items = items.filter((i) =>
      i.name.toLowerCase().includes(name.toLowerCase()),
    );
  }
  if (location && typeof location === "string") {
    items = items.filter((i) =>
      i.location?.toLowerCase().includes(location.toLowerCase()),
    );
  }
  if (status && typeof status === "string") {
    items = items.filter((i) => i.status === status);
  }
  res.json(items);
});

// GET /inventory/:id - get item details
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  const reservedPaths = new Set([
    "hotels",
    "room-types",
    "rooms",
    "allocations",
    "availability",
    "rate-plans",
    "yield-rules",
    "competitive-rates",
  ]);

  if (reservedPaths.has(req.params.id)) {
    return next();
  }

  const item = inventory.find((i) => i.id === req.params.id);
  if (!item)
    return res.status(404).json({ message: "Inventory item not found." });
  res.json(item);
});

// POST /inventory - create new item
router.post("/", (req: Request, res: Response) => {
  const { name, description, quantity, location, status, metadata } =
    req.body ?? {};
  if (!name || typeof quantity !== "number" || !status) {
    return res
      .status(400)
      .json({ message: "Name, quantity, and status are required." });
  }
  if (!["active", "inactive", "out-of-stock"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }
  const newItem: InventoryItem = {
    id: String(Date.now()),
    name,
    description,
    quantity,
    location,
    status,
    metadata,
  };
  inventory.push(newItem);
  res.status(201).json(newItem);
});

// PUT /inventory/:id - update item
router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, quantity, location, status, metadata } =
    req.body ?? {};
  const idx = inventory.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Inventory item not found." });
  }
  if (name) inventory[idx].name = name;
  if (description !== undefined) inventory[idx].description = description;
  if (typeof quantity === "number") inventory[idx].quantity = quantity;
  if (location !== undefined) inventory[idx].location = location;
  if (status && ["active", "inactive", "out-of-stock"].includes(status))
    inventory[idx].status = status;
  if (metadata !== undefined) inventory[idx].metadata = metadata;
  res.json(inventory[idx]);
});

// DELETE /inventory/:id - delete item
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = inventory.findIndex((i) => i.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Inventory item not found." });
  }
  const deleted = inventory.splice(idx, 1)[0];
  res.json(deleted);
});

const hotels: Hotel[] = [
  {
    id: "h1",
    name: "Grand Palace Hotel",
    address: "123 Main St, Cityville",
    features: ["Pool", "Spa", "Gym", "Free WiFi"],
    description: "Luxury hotel in the city center.",
    images: [],
    videos: [],
  },
  {
    id: "h2",
    name: "Seaside Resort",
    address: "456 Beach Rd, Seaville",
    features: ["Beach Access", "Bar", "Restaurant"],
    description: "Relaxing resort by the sea.",
    images: [],
    videos: [],
  },
];

const roomTypes: RoomType[] = [
  {
    id: "rt1",
    name: "Deluxe",
    description: "Deluxe Room",
    features: ["AC", "WiFi", "TV"],
    hotelId: "h1",
  },
  {
    id: "rt2",
    name: "Suite",
    description: "Suite Room",
    features: ["AC", "WiFi", "TV", "Mini Bar"],
    hotelId: "h2",
  },
];

const rooms: Room[] = [
  {
    id: "r1",
    typeId: "rt1",
    number: "101",
    status: "available",
    features: ["AC", "WiFi"],
    hotelId: "h1",
  },
  {
    id: "r2",
    typeId: "rt2",
    number: "201",
    status: "occupied",
    features: ["AC", "WiFi", "Mini Bar"],
    hotelId: "h2",
  },
];
// Hotels CRUD
router.get("/hotels", (_req: Request, res: Response) => res.json(hotels));
router.get("/hotels/:id", (req: Request, res: Response) => {
  const hotel = hotels.find((h) => h.id === req.params.id);
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  res.json(hotel);
});
router.post(
  "/hotels",
  hotelUpload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  (
    req: Request & { files?: { [fieldname: string]: MulterFile[] } },
    res: Response,
  ) => {
    const { name, address, features, description } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });
    const images =
      req.files && req.files["images"]
        ? req.files["images"].map((f) => "/uploads/hotels/" + f.filename)
        : [];
    const videos =
      req.files && req.files["videos"]
        ? req.files["videos"].map((f) => "/uploads/hotels/" + f.filename)
        : [];
    const newHotel: Hotel = {
      id: String(Date.now()),
      name,
      address,
      features: features
        ? features.split(",").map((f: string) => f.trim())
        : [],
      description,
      images,
      videos,
    };
    hotels.push(newHotel);
    res.status(201).json(newHotel);
  },
);
router.put(
  "/hotels/:id",
  hotelUpload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  (
    req: Request & { files?: { [fieldname: string]: MulterFile[] } },
    res: Response,
  ) => {
    const hotel = hotels.find((h) => h.id === req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });
    const { name, address, features, description } = req.body;
    if (name) hotel.name = name;
    if (address !== undefined) hotel.address = address;
    if (features !== undefined)
      hotel.features = features.split(",").map((f: string) => f.trim());
    if (description !== undefined) hotel.description = description;
    if (req.files && req.files["images"])
      hotel.images = req.files["images"].map(
        (f) => "/uploads/hotels/" + f.filename,
      );
    if (req.files && req.files["videos"])
      hotel.videos = req.files["videos"].map(
        (f) => "/uploads/hotels/" + f.filename,
      );
    res.json(hotel);
  },
);
router.delete("/hotels/:id", (req: Request, res: Response) => {
  const idx = hotels.findIndex((h) => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Hotel not found" });
  const deleted = hotels.splice(idx, 1)[0];
  res.json(deleted);
});

const allocations: Allocation[] = [
  {
    id: "a1",
    roomId: "r2",
    startDate: "2026-01-21",
    endDate: "2026-01-25",
    status: "allocated",
    guestName: "John Doe",
    bookingId: "b123",
  },
];

// Room Types CRUD
router.get("/room-types", (req: Request, res: Response) => {
  const { hotelId } = req.query;
  let types = roomTypes;
  if (hotelId && typeof hotelId === "string") {
    types = types.filter((rt) => rt.hotelId === hotelId);
  }
  res.json(types);
});
router.post("/room-types", (req: Request, res: Response) => {
  const { name, description, features, hotelId } = req.body;
  if (!name || !hotelId)
    return res.status(400).json({ message: "Name and hotelId required" });
  const newType: RoomType = {
    id: String(Date.now()),
    name,
    description,
    features,
    hotelId,
  };
  roomTypes.push(newType);
  res.status(201).json(newType);
});
router.put("/room-types/:id", (req: Request, res: Response) => {
  const type = roomTypes.find((rt) => rt.id === req.params.id);
  if (!type) return res.status(404).json({ message: "Room type not found" });
  Object.assign(type, req.body);
  res.json(type);
});
router.delete("/room-types/:id", (req: Request, res: Response) => {
  const idx = roomTypes.findIndex((rt) => rt.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ message: "Room type not found" });
  const deleted = roomTypes.splice(idx, 1)[0];
  res.json(deleted);
});

// Rooms CRUD
router.get("/rooms", (req: Request, res: Response) => {
  const { hotelId, typeId } = req.query;
  let filteredRooms = rooms;
  if (hotelId && typeof hotelId === "string") {
    filteredRooms = filteredRooms.filter((r) => r.hotelId === hotelId);
  }
  if (typeId && typeof typeId === "string") {
    filteredRooms = filteredRooms.filter((r) => r.typeId === typeId);
  }
  res.json(filteredRooms);
});
router.post("/rooms", (req: Request, res: Response) => {
  const { typeId, number, status, features, hotelId } = req.body;
  if (!typeId || !number || !status || !hotelId)
    return res
      .status(400)
      .json({ message: "typeId, number, status, and hotelId required" });
  const newRoom: Room = {
    id: String(Date.now()),
    typeId,
    number,
    status,
    features,
    hotelId,
  };
  rooms.push(newRoom);
  res.status(201).json(newRoom);
});
router.put("/rooms/:id", (req: Request, res: Response) => {
  const room = rooms.find((r) => r.id === req.params.id);
  if (!room) return res.status(404).json({ message: "Room not found" });
  Object.assign(room, req.body);
  res.json(room);
});
router.delete("/rooms/:id", (req: Request, res: Response) => {
  const idx = rooms.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Room not found" });
  const deleted = rooms.splice(idx, 1)[0];
  res.json(deleted);
});

// Allocations CRUD & availability
router.get("/allocations", (req: Request, res: Response) => {
  const { roomId, from, to, status } = req.query;
  let result = allocations;
  if (roomId && typeof roomId === "string")
    result = result.filter((a) => a.roomId === roomId);
  if (status && typeof status === "string")
    result = result.filter((a) => a.status === status);
  if (from && typeof from === "string")
    result = result.filter((a) => a.startDate >= from);
  if (to && typeof to === "string")
    result = result.filter((a) => a.endDate <= to);
  res.json(result);
});
router.post("/allocations", (req: Request, res: Response) => {
  const { roomId, startDate, endDate, status, guestName, bookingId } = req.body;
  if (!roomId || !startDate || !endDate || !status)
    return res
      .status(400)
      .json({ message: "roomId, startDate, endDate, status required" });
  const newAlloc: Allocation = {
    id: String(Date.now()),
    roomId,
    startDate,
    endDate,
    status,
    guestName,
    bookingId,
  };
  allocations.push(newAlloc);
  res.status(201).json(newAlloc);
});
router.put("/allocations/:id", (req: Request, res: Response) => {
  const alloc = allocations.find((a) => a.id === req.params.id);
  if (!alloc) return res.status(404).json({ message: "Allocation not found" });
  Object.assign(alloc, req.body);
  res.json(alloc);
});
router.delete("/allocations/:id", (req: Request, res: Response) => {
  const idx = allocations.findIndex((a) => a.id === req.params.id);
  if (idx === -1)
    return res.status(404).json({ message: "Allocation not found" });
  const deleted = allocations.splice(idx, 1)[0];
  res.json(deleted);
});

// Availability query
router.get("/availability", (req: Request, res: Response) => {
  const { hotelId, typeId, date } = req.query;
  let availableRooms = rooms.filter((r) => r.status === "available");
  if (hotelId && typeof hotelId === "string")
    availableRooms = availableRooms.filter((r) => r.hotelId === hotelId);
  if (typeId && typeof typeId === "string")
    availableRooms = availableRooms.filter((r) => r.typeId === typeId);
  if (date && typeof date === "string") {
    // Exclude rooms with allocations overlapping the date
    availableRooms = availableRooms.filter(
      (r) =>
        !allocations.some(
          (a) =>
            a.roomId === r.id &&
            a.startDate <= date &&
            a.endDate >= date &&
            a.status === "allocated",
        ),
    );
    // Exclude rooms blocked by revenue blocks
    availableRooms = availableRooms.filter((r) => {
      const blocks = revenueBlocks.filter(
        (b) =>
          b.hotelId === r.hotelId && b.startDate <= date && b.endDate >= date,
      );
      if (!blocks.length) return true;
      // If blocks exist, reduce available count accordingly (for mock, just exclude rooms if blocks exist)
      return false;
    });
  }
  res.json(availableRooms);
});

// Advanced Inventory Management - Revenue Management & Yield Optimization
export interface RatePlan {
  id: string;
  hotelId: string;
  name: string;
  description: string;
  baseRate: number;
  currency: string;
  isActive: boolean;
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
  seasons: Array<{
    startDate: string;
    endDate: string;
    multiplier: number; // Rate multiplier for the season
  }>;
}

export interface YieldRule {
  id: string;
  hotelId: string;
  name: string;
  trigger: "occupancy" | "demand" | "competition" | "events";
  conditions: {
    occupancyThreshold?: number;
    demandScore?: number;
    competitorRate?: number;
    eventType?: string;
  };
  action: {
    rateAdjustment: number; // Percentage adjustment
    minRate?: number;
    maxRate?: number;
    applyTo: "all" | "specific_rates";
  };
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export interface CompetitiveRate {
  hotelId: string;
  competitorName: string;
  competitorRate: number;
  ourRate: number;
  difference: number;
  lastUpdated: string;
  source: string;
}

export interface RevenueAnalytics {
  hotelId: string;
  period: string;
  occupancy: number;
  averageDailyRate: number;
  revenuePerAvailableRoom: number;
  totalRevenue: number;
  bookingPace: number;
  forecastOccupancy: number;
  recommendedRate: number;
}

// Mock data for advanced features
const ratePlans: RatePlan[] = [
  {
    id: "rp1",
    hotelId: "h1",
    name: "Standard Rate",
    description: "Standard room rate",
    baseRate: 150,
    currency: "USD",
    isActive: true,
    restrictions: {
      minStay: 1,
      maxStay: 30,
    },
    seasons: [
      { startDate: "2026-06-01", endDate: "2026-08-31", multiplier: 1.3 },
      { startDate: "2026-12-20", endDate: "2026-01-05", multiplier: 1.5 },
    ],
  },
];

const yieldRules: YieldRule[] = [
  {
    id: "yr1",
    hotelId: "h1",
    name: "High Demand Surge",
    trigger: "occupancy",
    conditions: { occupancyThreshold: 80 },
    action: {
      rateAdjustment: 25,
      minRate: 180,
      maxRate: 300,
      applyTo: "all",
    },
    isActive: true,
    priority: 10,
    createdAt: "2026-01-20T10:00:00Z",
  },
];

const competitiveRates: CompetitiveRate[] = [
  {
    hotelId: "h1",
    competitorName: "City Hotel",
    competitorRate: 165,
    ourRate: 150,
    difference: -15,
    lastUpdated: "2026-01-21T08:00:00Z",
    source: "Booking.com",
  },
];

// Rate Plans Management
router.get("/rate-plans", (req: Request, res: Response) => {
  const { hotelId, active } = req.query;
  let plans = ratePlans;

  if (hotelId && typeof hotelId === "string") {
    plans = plans.filter((p) => p.hotelId === hotelId);
  }

  if (active !== undefined) {
    const isActive = active === "true";
    plans = plans.filter((p) => p.isActive === isActive);
  }

  res.json(plans);
});

router.post("/rate-plans", (req: Request, res: Response) => {
  const {
    hotelId,
    name,
    description,
    baseRate,
    currency,
    restrictions,
    seasons,
  } = req.body;

  if (!hotelId || !name || typeof baseRate !== "number" || !currency) {
    return res
      .status(400)
      .json({ error: "hotelId, name, baseRate, and currency are required" });
  }

  const newPlan: RatePlan = {
    id: "rp-" + String(ratePlans.length + 1).padStart(3, "0"),
    hotelId,
    name,
    description: description || "",
    baseRate,
    currency,
    isActive: true,
    restrictions,
    seasons: seasons || [],
  };

  ratePlans.push(newPlan);
  res.status(201).json(newPlan);
});

// Yield Rules Management
router.get("/yield-rules", (req: Request, res: Response) => {
  const { hotelId, active } = req.query;
  let rules = yieldRules;

  if (hotelId && typeof hotelId === "string") {
    rules = rules.filter((r) => r.hotelId === hotelId);
  }

  if (active !== undefined) {
    const isActive = active === "true";
    rules = rules.filter((r) => r.isActive === isActive);
  }

  res.json(rules);
});

router.post("/yield-rules", (req: Request, res: Response) => {
  const { hotelId, name, trigger, conditions, action } = req.body;

  if (!hotelId || !name || !trigger || !conditions || !action) {
    return res.status(400).json({
      error: "hotelId, name, trigger, conditions, and action are required",
    });
  }

  const newRule: YieldRule = {
    id: "yr-" + String(yieldRules.length + 1).padStart(3, "0"),
    hotelId,
    name,
    trigger,
    conditions,
    action,
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
  };

  yieldRules.push(newRule);
  res.status(201).json(newRule);
});

// Dynamic Rate Calculation
router.post("/calculate-rate", (req: Request, res: Response) => {
  const { hotelId, checkInDate, occupancyRate } = req.body;

  if (!hotelId || !checkInDate) {
    return res
      .status(400)
      .json({ error: "hotelId and checkInDate are required" });
  }

  // Get base rate plan
  const ratePlan = ratePlans.find(
    (rp) => rp.hotelId === hotelId && rp.isActive,
  );
  if (!ratePlan) {
    return res
      .status(404)
      .json({ error: "No active rate plan found for hotel" });
  }

  let baseRate = ratePlan.baseRate;

  // Apply seasonal multiplier
  const checkIn = new Date(checkInDate);
  const applicableSeason = ratePlan.seasons.find(
    (season) =>
      checkIn >= new Date(season.startDate) &&
      checkIn <= new Date(season.endDate),
  );

  if (applicableSeason) {
    baseRate *= applicableSeason.multiplier;
  }

  // Apply yield rules
  const applicableRules = yieldRules
    .filter((rule) => rule.hotelId === hotelId && rule.isActive)
    .sort((a, b) => b.priority - a.priority);

  let finalRate = baseRate;

  for (const rule of applicableRules) {
    let shouldApply = false;

    switch (rule.trigger) {
      case "occupancy": {
        if (
          occupancyRate &&
          occupancyRate >= (rule.conditions.occupancyThreshold || 0)
        ) {
          shouldApply = true;
        }
        break;
      }
      case "demand": {
        // Mock demand score
        const demandScore = Math.floor(Math.random() * 100);
        if (demandScore >= (rule.conditions.demandScore || 0)) {
          shouldApply = true;
        }
        break;
      }
    }

    if (shouldApply) {
      const adjustment = (finalRate * rule.action.rateAdjustment) / 100;
      finalRate += adjustment;

      // Apply min/max limits
      if (rule.action.minRate && finalRate < rule.action.minRate) {
        finalRate = rule.action.minRate;
      }
      if (rule.action.maxRate && finalRate > rule.action.maxRate) {
        finalRate = rule.action.maxRate;
      }
    }
  }

  res.json({
    hotelId,
    checkInDate,
    baseRate: ratePlan.baseRate,
    seasonalRate: baseRate,
    finalRate: Math.round(finalRate * 100) / 100,
    currency: ratePlan.currency,
    appliedRules: applicableRules.map((r) => ({
      id: r.id,
      name: r.name,
      adjustment: r.action.rateAdjustment,
    })),
  });
});

// Competitive Rate Monitoring
router.get("/competitive-rates", (req: Request, res: Response) => {
  const { hotelId } = req.query;
  let rates = competitiveRates;

  if (hotelId && typeof hotelId === "string") {
    rates = rates.filter((r) => r.hotelId === hotelId);
  }

  res.json(rates);
});

router.post("/competitive-rates", (req: Request, res: Response) => {
  const { hotelId, competitorName, competitorRate, source } = req.body;

  if (!hotelId || !competitorName || typeof competitorRate !== "number") {
    return res.status(400).json({
      error: "hotelId, competitorName, and competitorRate are required",
    });
  }

  // Get our current rate (mock)
  const ourRate = 150; // This would come from rate calculation
  const difference = ourRate - competitorRate;

  const newRate: CompetitiveRate = {
    hotelId,
    competitorName,
    competitorRate,
    ourRate,
    difference,
    lastUpdated: new Date().toISOString(),
    source: source || "Manual Entry",
  };

  competitiveRates.push(newRate);
  res.status(201).json(newRate);
});

// Revenue Analytics
router.get("/analytics/:hotelId", (req: Request, res: Response) => {
  const { hotelId } = req.params;
  const { period = "30d" } = req.query;

  // Mock analytics data
  const analytics: RevenueAnalytics = {
    hotelId: hotelId as string,
    period: period as string,
    occupancy: 78.5,
    averageDailyRate: 185.5,
    revenuePerAvailableRoom: 145.7,
    totalRevenue: 45680,
    bookingPace: 12, // Bookings per day
    forecastOccupancy: 82.3,
    recommendedRate: 192.0,
  };

  res.json({ data: analytics });
});

// Bulk Rate Updates
router.post("/bulk-rate-update", (req: Request, res: Response) => {
  const { hotelId, rateAdjustment, reason } = req.body;

  if (!hotelId || typeof rateAdjustment !== "number") {
    return res
      .status(400)
      .json({ error: "hotelId and rateAdjustment are required" });
  }

  // Update all rate plans for the hotel
  const updatedPlans = ratePlans
    .filter((plan) => plan.hotelId === hotelId)
    .map((plan) => ({
      ...plan,
      baseRate: plan.baseRate * (1 + rateAdjustment / 100),
      updatedAt: new Date().toISOString(),
    }));

  // In real implementation, save to database
  res.json({
    success: true,
    message: `Updated ${updatedPlans.length} rate plans`,
    adjustment: rateAdjustment,
    reason,
    updatedPlans,
  });
});

// Inventory Optimization Suggestions
router.get(
  "/optimization-suggestions/:hotelId",
  (req: Request, res: Response) => {
    const { hotelId } = req.params;

    // Mock AI-powered suggestions
    const suggestions = [
      {
        type: "rate_increase",
        message:
          "Increase rates by 15% for peak season - Demand forecast shows 85% occupancy",
        impact: "+12% revenue",
        confidence: 89,
        recommendedAction: "Apply to all room types",
      },
      {
        type: "minimum_stay",
        message:
          "Implement 2-night minimum stay for weekends to improve occupancy",
        impact: "+8% revenue",
        confidence: 76,
        recommendedAction: "Apply to Friday-Saturday stays",
      },
      {
        type: "early_booking_discount",
        message: "Offer 10% discount for bookings 60+ days in advance",
        impact: "+15% advance bookings",
        confidence: 92,
        recommendedAction: "Create new rate plan with restrictions",
      },
    ];

    res.json({
      hotelId,
      suggestions,
      generatedAt: new Date().toISOString(),
      modelVersion: "RevenueAI v2.1",
    });
  },
);

export default router;
