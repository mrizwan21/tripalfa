import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Button } from "@tripalfa/ui-components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Input } from "@tripalfa/ui-components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tripalfa/ui-components/ui/tabs";
import {
  Plane,
  Building2,
  MapPin,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
} from "lucide-react";

export default function InventoryList() {
  const hotels = [
    {
      id: 1,
      name: "Grand Hyatt Dubai",
      location: "Dubai, UAE",
      rating: 5,
      rooms: 120,
      price: "$250",
    },
    {
      id: 2,
      name: "Ritz Paris",
      location: "Paris, France",
      rating: 5,
      rooms: 45,
      price: "$850",
    },
    {
      id: 3,
      name: "Hilton Garden Inn",
      location: "New York, USA",
      rating: 4,
      rooms: 200,
      price: "$180",
    },
    {
      id: 4,
      name: "Marina Bay Sands",
      location: "Singapore",
      rating: 5,
      rooms: 500,
      price: "$450",
    },
    {
      id: 5,
      name: "Atlantis The Palm",
      location: "Dubai, UAE",
      rating: 5,
      rooms: 350,
      price: "$320",
    },
    {
      id: 6,
      name: "The Plaza",
      location: "New York, USA",
      rating: 5,
      rooms: 150,
      price: "$600",
    },
  ];

  return (
    <div className="space-y-6 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Inventory Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage global hotel properties and flight routes.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm gap-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search hotels, cities..."
            className="pl-8 bg-background"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="hotels" className="w-full">
        <TabsList>
          <TabsTrigger value="hotels" className="gap-2">
            <Building2 className="h-4 w-4" /> Hotels
          </TabsTrigger>
          <TabsTrigger value="flights" className="gap-2">
            <Plane className="h-4 w-4" /> Flights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50"
              >
                <div className="aspect-video w-full bg-muted relative">
                  <img
                    src={`https://source.unsplash.com/random/800x600?hotel,${hotel.id}`}
                    alt={hotel.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur-md hover:bg-black/60 border-0">
                    {hotel.rooms} Rooms
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-2 space-y-0 gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-lg">{hotel.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {hotel.location}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mr-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex justify-between items-center border-t bg-muted/20 mt-4 gap-4">
                  <div className="text-sm font-medium">
                    From{" "}
                    <span className="text-lg font-bold">{hotel.price}</span>
                    /night
                  </div>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="flights">
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed bg-muted/10 gap-4">
            <Plane className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Flight Inventory</h3>
            <p className="text-muted-foreground max-w-sm mt-1 mb-4">
              Flight inventory is currently managed through external supplier
              APIs (Duffel, Amadeus).
            </p>
            <Button variant="outline">Configure Integration</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
