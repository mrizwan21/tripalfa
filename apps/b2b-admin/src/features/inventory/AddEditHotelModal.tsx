import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Upload, Image as ImageIcon, Film, Plus, Check, Info, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

const hotelSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  features: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type HotelFormValues = z.infer<typeof hotelSchema>;

interface Hotel {
  id: string;
  name: string;
  address?: string;
  features?: string[];
  description?: string;
  images?: string[];
  videos?: string[];
}

interface AddEditHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel?: Hotel | null;
  onSave: (data: FormData) => void;
}

export const AddEditHotelModal: React.FC<AddEditHotelModalProps> = ({
  isOpen,
  onClose,
  hotel,
  onSave,
}) => {
  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('general');

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: hotel?.name || '',
      address: hotel?.address || '',
      features: hotel?.features?.join(', ') || '',
      description: hotel?.description || '',
    },
  });

  useEffect(() => {
    if (hotel) {
      form.reset({
        name: hotel.name,
        address: hotel.address || '',
        features: hotel.features?.join(', ') || '',
        description: hotel.description || '',
      });
      setImagePreviews(hotel.images || []);
      setVideoPreviews(hotel.videos || []);
    } else {
      form.reset({
        name: '',
        address: '',
        features: '',
        description: '',
      });
      setImages([]);
      setVideos([]);
      setImagePreviews([]);
      setVideoPreviews([]);
    }
  }, [hotel, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...previews]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setVideos(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setVideoPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (values: HotelFormValues) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('address', values.address);
    formData.append('features', values.features || '');
    formData.append('description', values.description);

    images.forEach(image => formData.append('images', image));
    videos.forEach(video => formData.append('videos', video));

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {hotel ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
          <p className="text-gray-500 mt-1">Configure your property details, features and media.</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="flex">
              {/* Sidebar Tabs */}
              <div className="w-56 border-r bg-gray-50/50 p-4 space-y-2">
                <Button
                  type="button"
                  variant={activeTab === 'general' ? 'secondary' : 'ghost'}
                  className="w-full justify-start font-semibold" onClick={() => setActiveTab('general')} > <Info className="mr-2 h-4 w-4" />
                  General
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'features' ? 'secondary' : 'ghost'}
                  className="w-full justify-start font-semibold" onClick={() => setActiveTab('features')} > <Plus className="mr-2 h-4 w-4" />
                  Features
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'media' ? 'secondary' : 'ghost'}
                  className="w-full justify-start font-semibold" onClick={() => setActiveTab('media')} > <ImageIcon className="mr-2 h-4 w-4" />
                  Media
                </Button>
                <Button
                  type="button"
                  variant={activeTab === 'description' ? 'secondary' : 'ghost'}
                  className="w-full justify-start font-semibold" onClick={() => setActiveTab('description')} > <Check className="mr-2 h-4 w-4" />
                  Details
                </Button>
              </div>

              {/* Main Content Area */}
              <ScrollArea className="flex-1 h-[600px] p-8">
                {activeTab === 'general' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">Property Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Grand Alfa Resort" {...field} className="h-12 text-lg border-gray-200 focus:ring-primary/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">Location Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                              <Input placeholder="123 Luxury Way, Dubai" {...field} className="pl-10 h-12 border-gray-200 focus:ring-primary/20" />
                            </div>
                          </FormControl>
                          <FormMessage />
                          <FormDescription>Physical address for the property listing.</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">Property Features</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Pool, Spa, Gym, Private Beach..."
                              {...field}
                              className="min-h-[120px] text-base border-gray-200 focus:ring-primary/20"
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>Separate multiple features with commas.</FormDescription>
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {form.getValues('features')?.split(',').filter(f => f.trim()).map((feat, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary border-none">
                          {feat.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'media' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <h4 className="text-base font-bold mb-4 flex items-center">
                        <ImageIcon className="mr-2 h-5 w-5 text-primary" />
                        Property Photos
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group">
                          <Upload className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-bold text-gray-500 mt-2 group-hover:text-primary">Add Photo</span>
                          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold mb-4 flex items-center">
                        <Film className="mr-2 h-5 w-5 text-primary" />
                        Property Videos
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {videoPreviews.map((preview, index) => (
                          <div key={index} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                            <video src={preview} className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group">
                          <Upload className="h-8 w-8 text-gray-400 group-hover:text-primary" />
                          <span className="text-sm font-bold text-gray-500 mt-2 group-hover:text-primary">Add Video</span>
                          <input type="file" multiple accept="video/*" onChange={handleVideoChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'description' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold">Property Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the unique features and value proposition..."
                              {...field}
                              className="min-h-[250px] text-base border-gray-200 focus:ring-primary/20 leading-relaxed"
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription>Write a compelling description for potential guests.</FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </ScrollArea>
            </div>

            <DialogFooter className="p-6 border-t bg-gray-50/50">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6 font-bold hover:bg-white">
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-8 font-extrabold bg-gray-900 hover:bg-primary transition-all shadow-lg hover:shadow-primary/25">
                {hotel ? 'Update Property' : 'Save Property'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
