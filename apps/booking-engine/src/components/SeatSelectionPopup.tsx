import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchSeatMaps } from "../lib/api";

interface SeatSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSeats: any[]) => void;
  isLCC?: boolean;
  offerId?: string;
}

export const SeatSelectionPopup = ({
  isOpen,
  onClose,
  onConfirm,
  isLCC = false,
  offerId,
}: SeatSelectionPopupProps): React.JSX.Element | null => {
  const [selectedPassenger, setSelectedPassenger] = useState(1);
  const [isConfirming, setIsConfirming] = useState(false);

  const { data: seatMaps, isLoading } = useQuery({
    queryKey: ["seat-maps", offerId],
    queryFn: () => fetchSeatMaps(offerId!),
    enabled: !!offerId && isOpen,
  });

  const [seatMap, setSeatMap] = React.useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);

  React.useEffect(() => {
    if (seatMaps && seatMaps.length > 0) {
      const firstMap = seatMaps[0];
      const flatMap: any[] = [];
      firstMap.cabins.forEach((cabin: any) => {
        cabin.rows.forEach((row: any) => {
          row.sections.forEach((section: any) => {
            section.elements.forEach((element: any) => {
              if (element.type === "seat") {
                flatMap.push({
                  id: element.designator,
                  designator: element.designator,
                  status:
                    element.available_services?.length > 0
                      ? "free"
                      : "unavailable",
                  price: parseFloat(
                    element.available_services?.[0]?.total_amount || "0",
                  ),
                  isExitRow: row.is_exit_row === true,
                });
              }
            });
          });
        });
      });
      setSeatMap(flatMap);
    } else if (!isLoading && !seatMaps && isOpen) {
      const mockSeats = Array.from({ length: 90 }, (_, i) => ({
        id: i + 1,
        designator: `${Math.ceil((i + 1) / 6)}${"ABCDEF"[i % 6]}`,
        status: Math.random() > 0.3 ? "free" : "unavailable",
        price: Math.random() > 0.8 ? 50 : 0,
        isExitRow: i >= 54 && i < 60,
      }));
      setSeatMap(mockSeats);
    }
  }, [seatMaps, isLoading, isOpen]);

  if (!isOpen) return null;

  const passengers = [
    {
      id: 1,
      name: "Arun Kumar",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arun",
    },
    {
      id: 2,
      name: "Enbeae Mohamed",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Enbeae",
    },
    {
      id: 3,
      name: "Nader Alqamoudi",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nader",
    },
  ];

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 gap-2">
        <div
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setIsConfirming(false)}
        />
        <div className="relative bg-card w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 relative gap-2">
            <div className="absolute inset-0 bg-primary blur-xl opacity-20 scale-150 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-foreground text-center text-2xl font-semibold tracking-tight">
            Are you sure you want to add Selected Seat to the booking
          </h2>

          <div className="w-full space-y-4">
            <p className="text-[10px] font-black text-center text-primary uppercase tracking-widest">
              Seat selected summary
            </p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-4 py-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Flight No.
                  </th>
                  <th className="px-4 py-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Sequence No.
                  </th>
                  <th className="px-4 py-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Seat No.
                  </th>
                  <th className="px-4 py-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Class
                  </th>
                  <th className="px-4 py-2 text-left text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {selectedSeats.map((seat, i) => (
                  <tr
                    key={i}
                    className="text-[9px] font-bold text-muted-foreground"
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted rounded-sm" />
                      {seat.name}
                    </td>
                    <td className="px-4 py-3">{seat.flightNo}</td>
                    <td className="px-4 py-3">{seat.seqNo}</td>
                    <td className="px-4 py-3">{seat.seatNo}</td>
                    <td className="px-4 py-3">{seat.class}</td>
                    <td className="px-4 py-3">${seat.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirming(false)}
              className="flex-1 h-12 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest gap-4"
            >
              No Need
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onConfirm(selectedSeats)}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-4"
            >
              Yes, Sure
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className="relative bg-card w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-border flex flex-col max-h-[95vh]"
        data-testid="seat-selection-modal"
      >
        <div className="p-8 text-center relative border-b border-border/50">
          <h2 className="text-2xl font-black text-foreground">Seat Map</h2>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all gap-2"
            >
              <ChevronLeft size={20} />
            </Button>
            <div className="flex gap-4">
              {passengers.map((p) => (
                <Button
                  variant="outline"
                  size="md"
                  key={p.id}
                  onClick={() => setSelectedPassenger(p.id)}
                  className={`px-8 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${
                    selectedPassenger === p.id
                      ? "bg-accent border-accent shadow-xl shadow-accent/20 scale-105 text-accent-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <img
                    src={p.avatar}
                    className="w-8 h-8 rounded-full bg-blue-100 border border-white"
                    alt=""
                  />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    {p.name}
                  </span>
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all gap-2"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-8 bg-muted/50 p-12 rounded-[3.5rem] border border-border">
            <div className="flex gap-10">
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                Select the seat
              </div>
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  size="md"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-black flex items-center gap-2"
                >
                  DXB - LON{" "}
                  <img
                    src="/airplane-white.svg"
                    className="w-4 h-4 opacity-50 rotate-90"
                  />
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="px-6 py-2 border border-primary text-primary rounded-lg text-xs font-black flex items-center gap-2"
                >
                  LON - DXB{" "}
                  <img
                    src="/airplane-purple.svg"
                    className="w-4 h-4 opacity-50 rotate-90"
                  />
                </Button>
              </div>
            </div>

            <div className="flex gap-8">
              {[
                { label: "Seat Unavailable", color: "bg-muted" },
                {
                  label: isLCC ? "Paid Seat ($15+)" : "Free Seat ($0)",
                  color: "bg-primary",
                },
                { label: "Premium/Exit row", color: "bg-purple-300" },
                { label: "Chosen Seat", color: "bg-accent" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl h-auto flex flex-col items-center justify-between p-8 px-12 group overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-8 bg-muted/50 flex items-center justify-center border-r border-border gap-2">
                <span className="text-[8px] font-black text-muted-foreground rotate-270 uppercase tracking-widest">
                  Exit row
                </span>
              </div>
              <div className="absolute inset-y-0 right-0 w-8 bg-muted/50 flex items-center justify-center border-l border-border gap-2">
                <span className="text-[8px] font-black text-muted-foreground rotate-90 uppercase tracking-widest">
                  Exit row
                </span>
              </div>
              <div className="relative w-full max-w-sm">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Loading Live Seat Map...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2">
                    {seatMap.map((s: any) => (
                      <Button
                        variant="outline"
                        size="md"
                        key={s.designator}
                        disabled={s.status === "unavailable"}
                        onClick={() => {
                          const seatNo = s.designator;
                          const currentPassenger = passengers.find(
                            (p) => p.id === selectedPassenger,
                          );
                          setSelectedSeats((prev) => {
                            const exists = prev.find(
                              (st) => st.name === currentPassenger?.name,
                            );
                            if (exists) {
                              return prev.map((st) =>
                                st.name === currentPassenger?.name
                                  ? { ...st, seatNo, price: s.price }
                                  : st,
                              );
                            }
                            return [
                              ...prev,
                              {
                                name: currentPassenger?.name,
                                flightNo: "EK226",
                                seqNo: "1",
                                seatNo,
                                class: "Y",
                                price: s.price,
                              },
                            ];
                          });
                        }}
                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center text-[7px] font-black ${
                          s.status === "unavailable"
                            ? "bg-muted border-border text-muted-foreground cursor-not-allowed"
                            : s.isExitRow
                              ? "bg-purple-300 border-purple-300 text-purple-700"
                              : selectedSeats.find(
                                    (st) => st.seatNo === s.designator,
                                  )
                                ? "bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20"
                                : s.status === "free"
                                  ? "bg-card border-border text-primary"
                                  : "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                        }`}
                      >
                        <span>{s.designator}</span>
                        {s.price > 0 && (
                          <span className="text-[4px] mt-0.5">${s.price}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-8 rounded-[2.5rem] border border-border space-y-6 w-full">
              <h3 className="text-[11px] font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                Seat selected summary
              </h3>
              <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Flight No.
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Sequence No.
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Seat No.
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Class
                      </th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedSeats.map((seat: any, i: number) => (
                      <tr
                        key={i}
                        className="text-[10px] font-black text-foreground"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full border-2 border-accent bg-card" />
                          {seat.name}
                        </td>
                        <td className="px-6 py-4">{seat.flightNo}</td>
                        <td className="px-6 py-4">{seat.seqNo}</td>
                        <td className="px-6 py-4">{seat.seatNo}</td>
                        <td className="px-6 py-4">{seat.class}</td>
                        <td className="px-6 py-4">${seat.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 w-full">
              <Button
                onClick={() => setIsConfirming(true)}
                data-testid="confirm-seat-selection"
                className="w-full max-w-xl h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1"
              >
                Add Seat Pay $
                {selectedSeats.reduce(
                  (sum: number, s: any) => sum + s.price,
                  0,
                )}
              </Button>
              <div className="flex items-start gap-3 max-w-lg">
                <Info
                  size={16}
                  className="text-accent-foreground shrink-0 mt-0.5"
                />
                <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wide italic">
                  Kindly note there is no seat assigned to an infant. Hence, if
                  you want to book a Bascinet then please send us a request
                  through our offline request form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
