/**
 * Phosphor Icons Integration
 *
 * Phosphor provides 7,700+ icons with multiple weights and animated variants.
 * Each icon supports weight variations: thin, light, regular, fill, duotone.
 *
 * The duotone and filled variants have built-in CSS animations.
 *
 * Usage:
 *   import { PhosphorIcon } from '@tripalfa/ui-components/icons/phosphor-icons';
 *   <PhosphorIcon name="CheckCircle" size={24} weight="duotone" color="#10B981" />
 *
 * Or use pre-configured animated icons directly:
 *   import { Check, X, Home, Plane, Hotel } from '@tripalfa/ui-components/icons/phosphor-icons';
 */

import * as React from 'react';
import {
  Check,
  CheckCircle,
  X,
  XCircle,
  Plus,
  Minus,
  House,
  User,
  Users,
  Gear,
  Bell,
  Envelope,
  Phone,
  MapPin,
  Calendar,
  Clock,
  MagnifyingGlass,
  Funnel,
  SlidersHorizontal,
  Download,
  Upload,
  Eye,
  EyeSlash,
  Lock,
  LockKey,
  Key,
  ShieldCheck,
  WarningCircle,
  Warning,
  Info,
  Question,
  Star,
  Heart,
  RocketLaunch,
  Sparkle,
  Lightning,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  ArrowsDownUp,
  CaretUpDown,
  ArrowClockwise,
  ArrowCounterClockwise,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Camera,
  Image,
  FileText,
  File,
  Folder,
  Clipboard,
  ClipboardText,
  ChartBar,
  ChartLineUp,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Wallet,
  CreditCard,
  Receipt,
  Tag,
  Gift,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Package,
  Airplane,
  AirplaneTakeoff,
  AirplaneTilt,
  AirplaneInFlight,
  Boat,
  Car,
  CarProfile,
  Bicycle,
  MapTrifold,
  Globe,
  GlobeHemisphereWest,
  Compass,
  NavigationArrow,
  Signpost,
  Tent,
  Umbrella,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  Wind,
  Drop,
  Waves,
  Mountains,
  FlowerTulip,
  Tree,
  Leaf,
  Flower,
  Plant,
  PawPrint,
  Dna,
  Brain,
  Heartbeat,
  Pulse,
  FirstAid,
  Stethoscope,
  Pill,
  Building,
  BuildingOffice,
  Storefront,
  Factory,
  Warehouse,
  HouseLine,
  Bed,
  Couch,
  Lamp,
  Desk,
  Bathtub,
  Shower,
  Toilet,
  CookingPot,
  Oven,
  Coffee,
  Wine,
  BeerStein,
  Cake,
  Cookie,
  Pizza,
  Hamburger,
  ForkKnife,
} from '@phosphor-icons/react';

// ============================================================================
// Icon Weight Types
// ============================================================================
export type IconWeight = 'thin' | 'light' | 'regular' | 'fill' | 'duotone';

// ============================================================================
// Phosphor Icon Component Props
// ============================================================================
export interface PhosphorIconProps extends React.HTMLAttributes<HTMLElement> {
  size?: number | string;
  weight?: IconWeight;
  color?: string;
  mirrored?: boolean;
  alt?: string;
}

// ============================================================================
// Animated Phosphor Icon Wrapper
// Adds hover animation to duotone and filled icons
// ============================================================================
function createAnimatedPhosphorIcon(BaseIcon: React.ComponentType<any>) {
  const AnimatedIcon = React.forwardRef<HTMLElement, PhosphorIconProps>(
    ({ className, weight = 'regular', size = 24, color, ...props }, ref) => {
      const hasAnimation = weight === 'duotone' || weight === 'fill';
      const animationClasses = hasAnimation
        ? 'transition-transform duration-300 hover:scale-110'
        : '';

      return (
        <BaseIcon
          ref={ref}
          className={`${className || ''} ${animationClasses}`.trim()}
          size={size}
          weight={weight}
          color={color}
          {...props}
        />
      );
    }
  );

  AnimatedIcon.displayName = 'PhosphorIcon';
  return AnimatedIcon;
}

// ============================================================================
// Pre-configured Animated Icons (Travel & Booking themed)
// ============================================================================

// UI & Navigation Icons
export const CheckIcon = createAnimatedPhosphorIcon(Check);
export const CheckCircleIcon = createAnimatedPhosphorIcon(CheckCircle);
export const XIcon = createAnimatedPhosphorIcon(X);
export const XCircleIcon = createAnimatedPhosphorIcon(XCircle);
export const PlusIcon = createAnimatedPhosphorIcon(Plus);
export const MinusIcon = createAnimatedPhosphorIcon(Minus);
export const HomeIcon = createAnimatedPhosphorIcon(House);
export const UserIcon = createAnimatedPhosphorIcon(User);
export const UsersIcon = createAnimatedPhosphorIcon(Users);
export const SettingsIcon = createAnimatedPhosphorIcon(Gear);
export const BellIcon = createAnimatedPhosphorIcon(Bell);
export const MailIcon = createAnimatedPhosphorIcon(Envelope);
export const PhoneIcon = createAnimatedPhosphorIcon(Phone);
export const MapPinIcon = createAnimatedPhosphorIcon(MapPin);
export const CalendarIcon = createAnimatedPhosphorIcon(Calendar);
export const ClockIcon = createAnimatedPhosphorIcon(Clock);
export const SearchIcon = createAnimatedPhosphorIcon(MagnifyingGlass);
export const FilterIcon = createAnimatedPhosphorIcon(Funnel);
export const DownloadIcon = createAnimatedPhosphorIcon(Download);
export const UploadIcon = createAnimatedPhosphorIcon(Upload);
export const EyeIcon = createAnimatedPhosphorIcon(Eye);
export const EyeOffIcon = createAnimatedPhosphorIcon(EyeSlash);
export const LockIcon = createAnimatedPhosphorIcon(Lock);
export const KeyIcon = createAnimatedPhosphorIcon(Key);
export const ShieldCheckIcon = createAnimatedPhosphorIcon(ShieldCheck);
export const AlertCircleIcon = createAnimatedPhosphorIcon(WarningCircle);
export const AlertTriangleIcon = createAnimatedPhosphorIcon(Warning);
export const InfoIcon = createAnimatedPhosphorIcon(Info);
export const QuestionIcon = createAnimatedPhosphorIcon(Question);
export const StarIcon = createAnimatedPhosphorIcon(Star);
export const HeartIcon = createAnimatedPhosphorIcon(Heart);
export const SparkleIcon = createAnimatedPhosphorIcon(Sparkle);
export const LightningIcon = createAnimatedPhosphorIcon(Lightning);

// Arrow & Navigation
export const ArrowRightIcon = createAnimatedPhosphorIcon(ArrowRight);
export const ArrowLeftIcon = createAnimatedPhosphorIcon(ArrowLeft);
export const ArrowUpIcon = createAnimatedPhosphorIcon(ArrowUp);
export const ArrowDownIcon = createAnimatedPhosphorIcon(ArrowDown);
export const CaretDownIcon = createAnimatedPhosphorIcon(CaretDown);
export const CaretUpIcon = createAnimatedPhosphorIcon(CaretUp);
export const CaretLeftIcon = createAnimatedPhosphorIcon(CaretLeft);
export const CaretRightIcon = createAnimatedPhosphorIcon(CaretRight);
export const RefreshIcon = createAnimatedPhosphorIcon(ArrowClockwise);

// Travel & Transportation Icons
export const PlaneIcon = createAnimatedPhosphorIcon(AirplaneTakeoff);
export const PlaneInFlightIcon = createAnimatedPhosphorIcon(AirplaneInFlight);
export const BoatIcon = createAnimatedPhosphorIcon(Boat);
export const CarIcon = createAnimatedPhosphorIcon(Car);
export const BicycleIcon = createAnimatedPhosphorIcon(Bicycle);
export const MapIcon = createAnimatedPhosphorIcon(MapTrifold);
export const GlobeIcon = createAnimatedPhosphorIcon(Globe);
export const CompassIcon = createAnimatedPhosphorIcon(Compass);
export const NavigationIcon = createAnimatedPhosphorIcon(NavigationArrow);
export const SignpostIcon = createAnimatedPhosphorIcon(Signpost);
export const TentIcon = createAnimatedPhosphorIcon(Tent);
export const UmbrellaIcon = createAnimatedPhosphorIcon(Umbrella);

// Weather Icons
export const SunIcon = createAnimatedPhosphorIcon(Sun);
export const MoonIcon = createAnimatedPhosphorIcon(Moon);
export const CloudIcon = createAnimatedPhosphorIcon(Cloud);
export const RainIcon = createAnimatedPhosphorIcon(CloudRain);
export const SnowIcon = createAnimatedPhosphorIcon(CloudSnow);
export const ThunderIcon = createAnimatedPhosphorIcon(CloudLightning);
export const ThermometerIcon = createAnimatedPhosphorIcon(Thermometer);
export const WindIcon = createAnimatedPhosphorIcon(Wind);
export const DropIcon = createAnimatedPhosphorIcon(Drop);
export const WavesIcon = createAnimatedPhosphorIcon(Waves);

// Hotel & Accommodation Icons
export const BuildingIcon = createAnimatedPhosphorIcon(Building);
export const StorefrontIcon = createAnimatedPhosphorIcon(Storefront);
export const WarehouseIcon = createAnimatedPhosphorIcon(Warehouse);
export const HouseIcon = createAnimatedPhosphorIcon(HouseLine);
export const BedIcon = createAnimatedPhosphorIcon(Bed);
export const ShowerIcon = createAnimatedPhosphorIcon(Shower);
export const ToiletIcon = createAnimatedPhosphorIcon(Toilet);
export const CoffeeIcon = createAnimatedPhosphorIcon(Coffee);

// Finance & Payment Icons
export const ChartBarIcon = createAnimatedPhosphorIcon(ChartBar);
export const TrendUpIcon = createAnimatedPhosphorIcon(TrendUp);
export const TrendDownIcon = createAnimatedPhosphorIcon(TrendDown);
export const DollarIcon = createAnimatedPhosphorIcon(CurrencyDollar);
export const WalletIcon = createAnimatedPhosphorIcon(Wallet);
export const CreditCardIcon = createAnimatedPhosphorIcon(CreditCard);
export const ReceiptIcon = createAnimatedPhosphorIcon(Receipt);
export const GiftIcon = createAnimatedPhosphorIcon(Gift);
export const ShoppingCartIcon = createAnimatedPhosphorIcon(ShoppingCart);
export const ShoppingBagIcon = createAnimatedPhosphorIcon(ShoppingBag);
export const TruckIcon = createAnimatedPhosphorIcon(Truck);
export const PackageIcon = createAnimatedPhosphorIcon(Package);

// File & Document Icons
export const FileTextIcon = createAnimatedPhosphorIcon(FileText);
export const FileIcon = createAnimatedPhosphorIcon(File);
export const FolderIcon = createAnimatedPhosphorIcon(Folder);
export const ClipboardIcon = createAnimatedPhosphorIcon(Clipboard);
export const ClipboardTextIcon = createAnimatedPhosphorIcon(ClipboardText);

// Media Icons
export const PlayIcon = createAnimatedPhosphorIcon(Play);
export const PauseIcon = createAnimatedPhosphorIcon(Pause);
export const CameraIcon = createAnimatedPhosphorIcon(Camera);
export const ImageIcon = createAnimatedPhosphorIcon(Image);

// Food & Dining Icons
export const WineIcon = createAnimatedPhosphorIcon(Wine);
export const BeerIcon = createAnimatedPhosphorIcon(BeerStein);
export const CakeIcon = createAnimatedPhosphorIcon(Cake);
export const PizzaIcon = createAnimatedPhosphorIcon(Pizza);
export const BurgerIcon = createAnimatedPhosphorIcon(Hamburger);
export const UtensilsIcon = createAnimatedPhosphorIcon(ForkKnife);

// Nature & Activity Icons
export const MountainIcon = createAnimatedPhosphorIcon(Mountains);
export const LeafIcon = createAnimatedPhosphorIcon(Leaf);
export const FlowerIcon = createAnimatedPhosphorIcon(Flower);
export const TreeIcon = createAnimatedPhosphorIcon(Tree);

// Health & Accessibility Icons
export const ActivityIcon = createAnimatedPhosphorIcon(Pulse);
export const BrainIcon = createAnimatedPhosphorIcon(Brain);
export const HeartPulseIcon = createAnimatedPhosphorIcon(Heartbeat);
export const PillIcon = createAnimatedPhosphorIcon(Pill);

// Status & Action Icons
export const RocketIcon = createAnimatedPhosphorIcon(RocketLaunch);
export const TagIcon = createAnimatedPhosphorIcon(Tag);

// Re-export raw Phosphor icons for direct access
export {
  Check,
  CheckCircle,
  X,
  XCircle,
  Plus,
  Minus,
  House,
  User,
  Users,
  Gear,
  Bell,
  Envelope,
  Phone,
  MapPin,
  Calendar,
  Clock,
  MagnifyingGlass,
  Funnel,
  SlidersHorizontal,
  Download,
  Upload,
  Eye,
  EyeSlash,
  Lock,
  LockKey,
  Key,
  ShieldCheck,
  WarningCircle,
  Warning,
  Info,
  Question,
  Star,
  Heart,
  RocketLaunch,
  Sparkle,
  Lightning,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CaretDown,
  CaretUp,
  CaretLeft,
  CaretRight,
  ArrowsDownUp,
  CaretUpDown,
  ArrowClockwise,
  ArrowCounterClockwise,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Camera,
  Image,
  FileText,
  File,
  Folder,
  Clipboard,
  ClipboardText,
  ChartBar,
  ChartLineUp,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Wallet,
  CreditCard,
  Receipt,
  Tag,
  Gift,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Package,
  Airplane,
  AirplaneTakeoff,
  AirplaneTilt,
  AirplaneInFlight,
  Boat,
  Car,
  CarProfile,
  Bicycle,
  MapTrifold,
  Globe,
  GlobeHemisphereWest,
  Compass,
  NavigationArrow,
  Signpost,
  Tent,
  Umbrella,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  Wind,
  Drop,
  Waves,
  Mountains,
  FlowerTulip,
  Tree,
  Leaf,
  Flower,
  Plant,
  PawPrint,
  Dna,
  Brain,
  Heartbeat,
  Pulse,
  FirstAid,
  Stethoscope,
  Pill,
  Building,
  BuildingOffice,
  Storefront,
  Factory,
  Warehouse,
  HouseLine,
  Bed,
  Couch,
  Lamp,
  Desk,
  Bathtub,
  Shower,
  Toilet,
  CookingPot,
  Oven,
  Coffee,
  Wine,
  BeerStein,
  Cake,
  Cookie,
  Pizza,
  Hamburger,
  ForkKnife,
} from '@phosphor-icons/react';
