import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TripLogerLayout } from "../components/layout/TripLogerLayout";
import {
  Search,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Loader2,
} from "lucide-react";
import { SearchAutocomplete } from "../components/ui/SearchAutocomplete";
import { TravelerSelector } from "../components/ui/TravelerSelector";
import { CabinSelector } from "../components/ui/CabinSelector";
import { DualMonthCalendar } from "../components/ui/DualMonthCalendar";
import { Button } from "../components/ui/button";
import { format } from "date-fns";
import { usePopularDestinations } from "../hooks/useStaticData";
import { useWikivoyageGuide } from "../hooks/useWikivoyage";
import { DestinationContentCard } from "../components/DestinationContentCard";
import { useTenantRuntime } from "@/components/providers/TenantRuntimeProvider";
import {
  DEFAULT_CONTENT_CONFIG,
  loadTenantContentConfig,
} from "../lib/tenantContentConfig";

type Suggestion = Record<string, any>;

interface PopularDestination {
  id: string;
  name: string;
  countryName: string;
  countryCode: string;
  hotelCount: number;
  imageUrl?: string | null;
  destinationType?: string;
}

const PLACEHOLDER_DESTINATION_IMAGE = "/images/placeholder-destination.jpg";

export default function FlightHome() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [contentConfig, setContentConfig] = useState(DEFAULT_CONTENT_CONFIG);
  const [activeTab, setActiveTab] = useState("Middle East");
  const { data: popularDestinations = [] } = usePopularDestinations(20);
  const [carouselStart, setCarouselStart] = useState(0);

  // Featured destination for Wikivoyage content - pick from top destinations
  const featuredDestination = popularDestinations[0]?.name || "Paris";
  const { data: wikivoyageContent, isLoading: isLoadingWiki } =
    useWikivoyageGuide(featuredDestination);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [toCode, setToCode] = useState("");
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [tripType, setTripType] = useState<
    "roundTrip" | "oneWay" | "multiCity"
  >("roundTrip");
  const marketingFlightHome = contentConfig.marketing.flightHome;
  const popularDestLabels = contentConfig.marketing.home.popularDestinations;
  const flightBenefits = marketingFlightHome.benefits;
  const searchFormLabels = marketingFlightHome.searchFormLabels;
  const tripTypeLabels = marketingFlightHome.tripTypeLabels;

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      try {
        const content = await loadTenantContentConfig();
        if (active) {
          setContentConfig(content);
        }
      } catch {
        if (active) {
          setContentConfig(DEFAULT_CONTENT_CONFIG);
        }
      }
    };

    loadContent();

    return () => {
      active = false;
    };
  }, []);

  // Multi-city legs (minimum 2)
  const [multiCityLegs, setMultiCityLegs] = useState<
    Array<{
      from: string;
      fromCode: string;
      to: string;
      toCode: string;
      date: Date | null;
    }>
  >([
    { from: "", fromCode: "", to: "", toCode: "", date: null },
    { from: "", fromCode: "", to: "", toCode: "", date: null },
  ]);

  const addMultiCityLeg = () => {
    setMultiCityLegs((prev) => [
      ...prev,
      { from: "", fromCode: "", to: "", toCode: "", date: null },
    ]);
  };

  const removeMultiCityLeg = (idx: number) => {
    if (multiCityLegs.length > 2) {
      setMultiCityLegs((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updateMultiCityLeg = (idx: number, field: string, value: any) => {
    setMultiCityLegs((prev) =>
      prev.map((leg, i) => (i === idx ? { ...leg, [field]: value } : leg)),
    );
  };

  const selectParamValue = (preferred: string, fallback: string) =>
    preferred || fallback;

  const setParamIfPresent = (
    params: URLSearchParams,
    key: string,
    preferred: string,
    fallback: string,
  ) => {
    const value = selectParamValue(preferred, fallback);
    if (value) {
      params.set(key, value);
    }
  };

  const handleSearch = () => {
    if (!runtimeConfig.features.flightBookingEnabled) {
      return;
    }
    const params = new URLSearchParams();
    params.set("tripType", tripType);

    // Multi-city: use leg[i][origin], leg[i][destination], leg[i][date] params
    if (tripType === "multiCity") {
      multiCityLegs.forEach((leg, i) => {
        setParamIfPresent(params, `leg[${i}][origin]`, leg.fromCode, leg.from);
        setParamIfPresent(params, `leg[${i}][destination]`, leg.toCode, leg.to);
        if (leg.date)
          params.set(`leg[${i}][date]`, format(leg.date, "yyyy-MM-dd"));
      });
      params.set("adults", "1");
      navigate(`/flights/list?${params.toString()}`);
      return;
    }

    // One-way / Round-trip
    setParamIfPresent(params, "origin", fromCode, from);
    setParamIfPresent(params, "destination", toCode, to);

    if (departureDate)
      params.set("departureDate", format(departureDate, "yyyy-MM-dd"));
    if (returnDate && tripType === "roundTrip")
      params.set("returnDate", format(returnDate, "yyyy-MM-dd"));
    params.set("adults", "1");
    navigate(`/flights/list?${params.toString()}`);
  };

  if (!runtimeConfig.features.flightBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-black text-foreground mb-3">
            {marketingFlightHome.disabledTitle}
          </h1>
          <p className="text-sm font-bold text-muted-foreground mb-6">
            {marketingFlightHome.disabledSubtitle}
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            className="h-11 px-6"
          >
            {marketingFlightHome.backToHomeLabel}
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      {/* Hero Section */}
      <div className="relative h-[600px] flex items-center justify-center overflow-hidden gap-2">
        {/* Background Image: Airplane Window/Wing view */}
        <div className="absolute inset-0 bg-cover bg-center hero-bg-flight z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--secondary)/0.8)] via-[hsl(var(--primary)/0.6)] to-[hsl(var(--accent)/0.4)]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--foreground)/0.4)] via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center gap-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 text-center drop-shadow-lg">
            {marketingFlightHome.heroTitle}
          </h1>
          <p className="text-white/90 mb-8 max-w-2xl text-center drop-shadow-md">
            {marketingFlightHome.heroSubtitle}
          </p>

          {/* Glassmorphic Search Card */}
          <div
            className="w-full max-w-5xl bg-card/10 backdrop-blur-md border border-border rounded-3xl p-6 shadow-2xl"
            data-testid="flight-search-form"
          >
            {/* Hidden inputs for E2E testing */}
            <select
              data-testid="flight-trip-type"
              className="hidden"
              value={tripType}
              onChange={(e) =>
                setTripType(
                  e.target.value as "roundTrip" | "oneWay" | "multiCity",
                )
              }
            >
              <option value="roundTrip">{tripTypeLabels?.roundTrip}</option>
              <option value="oneWay">{tripTypeLabels?.oneWay}</option>
              <option value="multiCity">{tripTypeLabels?.multiCity}</option>
            </select>
            <input
              type="text"
              data-testid="flight-date"
              className="hidden"
              value={departureDate ? format(departureDate, "yyyy-MM-dd") : ""}
              onChange={(e) => {
                const date = new Date(e.target.value);
                if (!isNaN(date.getTime())) {
                  setDepartureDate(date);
                }
              }}
            />

            {/* Tabs */}
            <div className="inline-flex bg-muted/20 rounded-full p-1 mb-6 backdrop-blur-sm gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  runtimeConfig.features.hotelBookingEnabled &&
                  navigate("/hotels")
                }
                disabled={!runtimeConfig.features.hotelBookingEnabled}
                className="px-6 text-white hover:bg-muted/10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>🏨</span> {marketingFlightHome.tabs.stays}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-6 rounded-full border-0 bg-card text-[hsl(var(--primary))] shadow-md hover:bg-card/90"
              >
                <span>✈️</span> {marketingFlightHome.tabs.flights}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Trip Type & Class (Radio/Dropdowns) can go here relative */}
              <div className="col-span-12 flex gap-4 mb-2 text-white text-xs font-bold px-2 items-center flex-wrap uppercase tracking-wider">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <input
                    type="radio"
                    name="trip"
                    checked={tripType === "roundTrip"}
                    onChange={() => setTripType("roundTrip")}
                    className="accent-[hsl(var(--secondary))]"
                  />{" "}
                  {tripTypeLabels?.roundTrip}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <input
                    type="radio"
                    name="trip"
                    checked={tripType === "oneWay"}
                    onChange={() => setTripType("oneWay")}
                    className="accent-[hsl(var(--secondary))]"
                  />{" "}
                  {tripTypeLabels?.oneWay}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <input
                    type="radio"
                    name="trip"
                    checked={tripType === "multiCity"}
                    onChange={() => setTripType("multiCity")}
                    className="accent-[hsl(var(--secondary))]"
                  />{" "}
                  {tripTypeLabels?.multiCity}
                </label>
                <div className="ml-auto flex items-center gap-4">
                  <CabinSelector />
                  <TravelerSelector />
                </div>
              </div>

              {/* From Input */}
              <div className="col-span-12 md:col-span-3 h-12">
                <SearchAutocomplete
                  type="flight"
                  placeholder={searchFormLabels?.fromPlaceholder}
                  icon={<MapPin size={20} />}
                  value={from}
                  onChange={setFrom}
                  onSelect={(loc: Suggestion) => {
                    // Display format: "Airport Name (CODE)"
                    if (loc.type === "AIRPORT") {
                      setFrom(`${loc.title} (${loc.code})`);
                      setFromCode(String(loc.code));
                    } else {
                      setFrom(loc.title);
                      setFromCode(loc.title);
                    }
                  }}
                  dataTestId="flight-from"
                />
              </div>

              {/* Swap Icon */}
              <div className="hidden md:flex col-span-1 items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const tmp = from;
                    setFrom(to);
                    setTo(tmp);
                    const tmpCode = fromCode;
                    setFromCode(toCode);
                    setToCode(tmpCode);
                  }}
                  className="bg-muted/20 p-2 rounded-full hover:bg-muted/30 backdrop-blur-sm text-white transition-colors"
                >
                  <div className="bg-card rounded-full p-1 shadow-lg">
                    <ChevronRight
                      size={16}
                      className="text-[hsl(var(--primary))]"
                    />
                  </div>
                </Button>
              </div>

              {/* To Input */}
              <div className="col-span-12 md:col-span-3 h-12">
                <SearchAutocomplete
                  type="flight"
                  placeholder={searchFormLabels?.toPlaceholder}
                  icon={<MapPin size={20} />}
                  value={to}
                  onChange={setTo}
                  onSelect={(loc: Suggestion) => {
                    // Display format: "Airport Name (CODE)"
                    if (loc.type === "AIRPORT") {
                      setTo(`${loc.title} (${loc.code})`);
                      setToCode(String(loc.code));
                    } else {
                      setTo(loc.title);
                      setToCode(loc.title);
                    }
                  }}
                  dataTestId="flight-to"
                />
              </div>

              {/* ── MULTI-CITY LEGS UI ────────────────────────────────────────────── */}
              {tripType === "multiCity" ? (
                <div className="col-span-12 space-y-3">
                  {multiCityLegs.map((leg, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-muted/5 rounded-xl p-3"
                    >
                      <div className="col-span-3">
                        <SearchAutocomplete
                          type="flight"
                          placeholder={`Leg ${idx + 1} ${searchFormLabels?.legFromLabel}`}
                          icon={<MapPin size={16} />}
                          value={leg.from}
                          onChange={(v) => updateMultiCityLeg(idx, "from", v)}
                          onSelect={(loc: Suggestion) => {
                            if (loc.type === "AIRPORT") {
                              updateMultiCityLeg(
                                idx,
                                "from",
                                `${loc.title} (${loc.code})`,
                              );
                              updateMultiCityLeg(
                                idx,
                                "fromCode",
                                String(loc.code),
                              );
                            } else {
                              updateMultiCityLeg(idx, "from", loc.title);
                              updateMultiCityLeg(idx, "fromCode", loc.title);
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <SearchAutocomplete
                          type="flight"
                          placeholder={`Leg ${idx + 1} ${searchFormLabels?.legToLabel}`}
                          icon={<MapPin size={16} />}
                          value={leg.to}
                          onChange={(v) => updateMultiCityLeg(idx, "to", v)}
                          onSelect={(loc: Suggestion) => {
                            if (loc.type === "AIRPORT") {
                              updateMultiCityLeg(
                                idx,
                                "to",
                                `${loc.title} (${loc.code})`,
                              );
                              updateMultiCityLeg(
                                idx,
                                "toCode",
                                String(loc.code),
                              );
                            } else {
                              updateMultiCityLeg(idx, "to", loc.title);
                              updateMultiCityLeg(idx, "toCode", loc.title);
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="date"
                          value={leg.date ? format(leg.date, "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            const d = e.target.value
                              ? new Date(e.target.value)
                              : null;
                            updateMultiCityLeg(idx, "date", d);
                          }}
                          className="w-full h-10 px-3 rounded-lg bg-card/90 text-foreground text-sm font-medium border-0 focus:ring-2 focus:ring-[hsl(var(--secondary))]"
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        {multiCityLegs.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMultiCityLeg(idx)}
                            className="h-8 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            {searchFormLabels?.removeLegLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addMultiCityLeg}
                    className="h-8 w-fit px-2 text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  >
                    {searchFormLabels?.addLegLabel}
                  </Button>

                  {/* Multi-city Search Button */}
                  <div className="pt-2">
                    <Button
                      onClick={handleSearch}
                      data-testid="flight-search-submit"
                      variant="secondary"
                      size="lg"
                      className="h-12 px-8 text-foreground shadow-lg shadow-yellow-500/20"
                    >
                      {searchFormLabels?.searchMultiCityCtaLabel}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Date Picker - Dual Month Calendar */}
                  <div className="col-span-12 md:col-span-3">
                    <DualMonthCalendar
                      departureDate={departureDate}
                      returnDate={returnDate}
                      onDepartureDateChange={setDepartureDate}
                      onReturnDateChange={setReturnDate}
                      mode="flight"
                      departureLabel={searchFormLabels?.departure}
                      returnLabel={searchFormLabels?.return}
                    />
                  </div>

                  {/* Search Button */}
                  <div className="col-span-12 md:col-span-2">
                    <Button
                      onClick={handleSearch}
                      data-testid="flight-search-submit"
                      variant="secondary"
                      size="lg"
                      className="w-full h-12 text-foreground shadow-lg shadow-yellow-500/20"
                    >
                      {searchFormLabels?.searchCtaLabel}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col md:flex-row justify-around items-center gap-6">
          <div className="flex items-center gap-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/751/751463.png"
              className="w-10 h-10 object-contain"
              alt="Search"
            />
            <div>
              <h3 className="font-bold text-[hsl(var(--secondary))] text-xl font-semibold tracking-tight">
                {flightBenefits[0]?.title}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {flightBenefits[0]?.subtitle}
              </p>
            </div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block"></div>
          <div className="flex items-center gap-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2645/2645607.png"
              className="w-10 h-10 object-contain"
              alt="Fees"
            />
            <div>
              <h3 className="font-bold text-[hsl(var(--secondary))] text-xl font-semibold tracking-tight">
                {flightBenefits[1]?.title}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {flightBenefits[1]?.subtitle}
              </p>
            </div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block"></div>
          <div className="flex items-center gap-4">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2921/2921226.png"
              className="w-10 h-10 object-contain"
              alt="Flexibility"
            />
            <div>
              <h3 className="font-bold text-[hsl(var(--secondary))] text-xl font-semibold tracking-tight">
                {flightBenefits[2]?.title}
              </h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {flightBenefits[2]?.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Flights Carousel – data from PostgreSQL */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {marketingFlightHome.popularFlights.title}
        </h2>
        <p className="text-muted-foreground mb-8 text-sm">
          {popularDestLabels.subtitle}
          {popularDestinations.length > 0 && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {popularDestinations.length}{" "}
              {popularDestLabels.nameLabel.toLowerCase()}s{" "}
              {popularDestLabels.dataSourceSuffixLabel}
            </span>
          )}
        </p>

        {/* Carousel window: show 5 at a time */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {popularDestinations.length > 0
            ? popularDestinations
                .slice(carouselStart, carouselStart + 5)
                .map((dest, i) => (
                  <div
                    key={dest.id}
                    className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer shadow-md"
                    onClick={() =>
                      navigate(
                        `/hotels?destination=${encodeURIComponent(dest.name)}`,
                      )
                    }
                  >
                    <img
                      src={
                        dest.imageUrl || "/images/placeholder-destination.jpg"
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={dest.name}
                    />
                    <div className="absolute inset-0 bg-[hsl(var(--foreground)/0.2)] group-hover:bg-[hsl(var(--foreground)/0.1)]"></div>
                    <div className="absolute bottom-0 left-0 w-full bg-[hsl(var(--secondary))] py-2 text-center font-bold text-xs uppercase tracking-wider text-[hsl(var(--secondary-foreground))]">
                      {dest.name}
                      {dest.countryCode && (
                        <span className="ml-1 opacity-60">
                          · {dest.countryCode}
                        </span>
                      )}
                      {dest.hotelCount > 0 && (
                        <span className="ml-1 opacity-60">
                          · {dest.hotelCount.toLocaleString()}{" "}
                          {popularDestLabels.priceLabel}
                        </span>
                      )}
                    </div>
                  </div>
                ))
            : /* Loading skeleton */
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden aspect-[4/3] bg-muted animate-pulse"
                />
              ))}
        </div>
        <div className="flex justify-between items-center mt-4 gap-4">
          <Button
            variant="primary"
            size="sm"
            className="h-10 w-10 rounded-full p-0 shadow-lg shadow-blue-200 disabled:opacity-40"
            onClick={() => setCarouselStart(Math.max(0, carouselStart - 5))}
            disabled={carouselStart === 0}
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="text-xs text-muted-foreground">
            {carouselStart + 1}–
            {Math.min(carouselStart + 5, popularDestinations.length)} of{" "}
            {popularDestinations.length}
          </span>
          <Button
            variant="primary"
            size="sm"
            className="h-10 w-10 rounded-full p-0 shadow-lg shadow-blue-200 disabled:opacity-40"
            onClick={() =>
              setCarouselStart(
                Math.min(popularDestinations.length - 5, carouselStart + 5),
              )
            }
            disabled={carouselStart + 5 >= popularDestinations.length}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Featured Destination Guide from Wikivoyage */}
      {(wikivoyageContent || isLoadingWiki) && (
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {marketingFlightHome.featuredGuide.title}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {marketingFlightHome.featuredGuide.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-600">
              <BookOpen className="w-4 h-4" />
              <span>{marketingFlightHome.featuredGuide.poweredByLabel}</span>
            </div>
          </div>

          <DestinationContentCard
            destination={featuredDestination}
            content={wikivoyageContent}
            isLoading={isLoadingWiki}
            variant="featured"
            onExplore={() =>
              navigate(
                `/hotels?destination=${encodeURIComponent(featuredDestination)}`,
              )
            }
          />
        </div>
      )}

      {/* Trending Destinations from PostgreSQL */}
      <div className="container mx-auto px-4 py-12 bg-card rounded-3xl mb-20 shadow-sm border border-border">
        <div className="flex items-center gap-8 border-b pb-4 mb-8 overflow-x-auto">
          <h3 className="font-bold text-lg whitespace-nowrap">
            {marketingFlightHome.trending.title}
          </h3>
          {marketingFlightHome.trending.tabs.map((tab) => (
            <Button
              variant="ghost"
              size="sm"
              key={tab}
              className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${activeTab === tab ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Top by hotel count */}
          <div className="space-y-3">
            <p className="text-[hsl(var(--secondary))] font-bold text-sm bg-[hsl(var(--secondary)/0.12)] inline-block px-2 py-1 rounded">
              {marketingFlightHome.trending.columnLabels.primary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations
                .filter(
                  (d) =>
                    activeTab === "All" ||
                    d.destinationType
                      ?.toLowerCase()
                      .includes(
                        activeTab
                          .toLowerCase()
                          .replace("ies", "y")
                          .replace("s", ""),
                      ),
                )
                .slice(0, 5)
                .map((d) => (
                  <li
                    key={d.id}
                    className="hover:underline cursor-pointer"
                    onClick={() =>
                      navigate(
                        `/hotels?destination=${encodeURIComponent(d.name)}`,
                      )
                    }
                  >
                    {d.name}, {d.countryCode}
                    <span className="ml-1 text-muted-foreground">
                      ({d.hotelCount?.toLocaleString()}{" "}
                      {marketingFlightHome.trending.columnLabels.countLabel})
                    </span>
                  </li>
                ))}
            </ul>
          </div>
          {/* Column 2: Next batch */}
          <div className="space-y-3">
            <p className="text-muted-foreground font-bold text-sm">
              {marketingFlightHome.trending.columnLabels.secondary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations.slice(5, 10).map((d) => (
                <li
                  key={d.id}
                  className="hover:underline cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/hotels?destination=${encodeURIComponent(d.name)}`,
                    )
                  }
                >
                  {d.name}, {d.countryCode}
                </li>
              ))}
            </ul>
          </div>
          {/* Column 3: Next batch */}
          <div className="space-y-3">
            <p className="text-muted-foreground font-bold text-sm">
              {marketingFlightHome.trending.columnLabels.tertiary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations.slice(10, 15).map((d) => (
                <li
                  key={d.id}
                  className="hover:underline cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/hotels?destination=${encodeURIComponent(d.name)}`,
                    )
                  }
                >
                  {d.name}, {d.countryCode}
                </li>
              ))}
            </ul>
          </div>
          {/* Column 4: Final batch */}
          <div className="space-y-3">
            <p className="text-muted-foreground font-bold text-sm">
              {marketingFlightHome.trending.columnLabels.quaternary}
            </p>
            <ul className="text-xs text-blue-500 space-y-2 font-medium">
              {popularDestinations.slice(15, 20).map((d) => (
                <li
                  key={d.id}
                  className="hover:underline cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/hotels?destination=${encodeURIComponent(d.name)}`,
                    )
                  }
                >
                  {d.name}, {d.countryCode}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}
