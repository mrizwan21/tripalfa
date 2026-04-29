import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Button } from '../ui/button';

interface ImageGalleryProps {
  images: { url: string; hero?: boolean }[];
  hotelName: string;
}

export function ImageGallery({
  images,
  hotelName,
}: ImageGalleryProps): React.JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-[440px] rounded-[2rem] bg-gray-100 flex items-center justify-center text-gray-400 gap-2">
        No images available
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <div className="relative w-full h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white mb-8 group">
        <img
          src={images[currentIndex].url}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt={`${hotelName} - Image ${currentIndex + 1}`}
        />

        {/* Overlays */}
        <div className="absolute top-6 left-6">
          <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest border border-white/10">
            Image {currentIndex + 1} of {images.length}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors border border-white/10 opacity-0 group-hover:opacity-100 translation-opacity duration-300 gap-2"
        >
          <Maximize2 size={18} />
        </Button>

        {/* Navigation Arrows */}
        <div className="absolute inset-y-0 flex items-center justify-between w-full px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handlePrev}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all border border-white/20 pointer-events-auto gap-2"
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all border border-white/20 pointer-events-auto gap-2"
          >
            <ChevronRight size={24} />
          </Button>
        </div>
      </div>

      {/* Thumbnails / Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="default"
          onClick={() => setCurrentIndex(0)}
          className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg active:scale-95 gap-2"
        >
          <ChevronLeft size={16} className="-mr-1" />
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handlePrev}
          className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg active:scale-95 gap-2"
        >
          <ChevronLeft size={20} />
        </Button>

        <div className="px-6 py-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <span className="text-gray-900 font-black text-sm tabular-nums">
            {currentIndex + 1} <span className="text-gray-300 mx-1">/</span>{" "}
            {images.length}
          </span>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={handleNext}
          className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg active:scale-95 gap-2"
        >
          <ChevronRight size={20} />
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={() => setCurrentIndex(images.length - 1)}
          className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg active:scale-95 gap-2"
        >
          <ChevronRight size={16} className="-ml-1" />
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
