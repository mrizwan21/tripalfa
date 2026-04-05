/**
 * Unified Icons Module
 *
 * Uses lucide-animated icons where available, falls back to lucide-react otherwise.
 * All icons are re-exported with lucide-react compatible naming (without "Icon" suffix).
 * Animated icons auto-play their animation on hover by default.
 *
 * Usage:
 *   import { ChevronLeft, Search, Plane } from '@tripalfa/ui-components/icons';
 *   <ChevronLeft size={24} className="text-primary" />
 */

import * as React from 'react';

// ============================================================================
// lucide-animated imports (animated icons)
// ============================================================================
// Import Hotel from lucide-react (not available in lucide-animated)
import { Hotel as HotelBase } from 'lucide-react';

import {
  ActivityIcon,
  AirplaneIcon,
  ArrowDownIcon,
  ArrowDownLeftIcon,
  ArrowDownRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowUpLeftIcon,
  ArrowUpRightIcon,
  BanIcon,
  BellIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckIcon,
  CheckCheckIcon,
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  CircleCheckIcon,
  CircleCheckBigIcon,
  CircleDashedIcon,
  CircleDollarSignIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  ClockIcon,
  CogIcon,
  CompassIcon,
  CopyIcon,
  CursorClickIcon,
  DatabaseIcon,
  DeleteIcon,
  DollarSignIcon,
  DownloadIcon,
  EarthIcon,
  EyeIcon,
  EyeOffIcon,
  FacebookIcon,
  FigmaIcon,
  FileChartLineIcon,
  FileCheckIcon,
  FileCheck2Icon,
  FileCogIcon,
  FilePenLineIcon,
  FileStackIcon,
  FingerprintIcon,
  FlameIcon,
  FolderArchiveIcon,
  FolderCheckIcon,
  FolderClockIcon,
  FolderCodeIcon,
  FolderCogIcon,
  FolderDownIcon,
  FolderGitIcon,
  FolderGit2Icon,
  FolderHeartIcon,
  FolderInputIcon,
  FolderKanbanIcon,
  FolderKeyIcon,
  FolderLockIcon,
  FolderMinusIcon,
  FolderOpenIcon,
  FolderOutputIcon,
  FolderPlusIcon,
  FolderRootIcon,
  FolderSyncIcon,
  FolderTreeIcon,
  FolderUpIcon,
  FolderXIcon,
  FoldersIcon,
  GithubIcon,
  GitlabIcon,
  GripHorizontalIcon,
  GripVerticalIcon,
  HandCoinsIcon,
  HandHeartIcon,
  HeartIcon,
  HeartHandshakeIcon,
  HistoryIcon,
  HomeIcon,
  HourglassIcon,
  IdCardIcon,
  InstagramIcon,
  KeyIcon,
  KeyCircleIcon,
  KeyboardIcon,
  LanguagesIcon,
  LayersIcon,
  LayoutPanelTopIcon,
  LinkIcon as LucideAnimatedLinkIcon,
  LinkedinIcon,
  ListIcon,
  LoaderPinwheelIcon,
  LockIcon,
  LockKeyholeIcon,
  LockKeyholeOpenIcon,
  LockOpenIcon,
  LogoutIcon,
  MailCheckIcon,
  MapPinIcon,
  Maximize2Icon,
  MenuIcon,
  MessageCircleIcon,
  MessageCircleDashedIcon,
  MessageCircleMoreIcon,
  MessageSquareIcon,
  MessageSquareDashedIcon,
  MessageSquareMoreIcon,
  MicIcon,
  MicOffIcon,
  MinimizeIcon,
  MoonIcon,
  PartyPopperIcon,
  PauseIcon,
  PenToolIcon,
  PlayIcon,
  PlusIcon,
  RabbitIcon,
  RadioIcon,
  RadioTowerIcon,
  RedoIcon,
  RedoDotIcon,
  RefreshCcwIcon,
  RefreshCcwDotIcon,
  RefreshCwIcon,
  RefreshCwOffIcon,
  RocketIcon,
  RotateCcwIcon,
  RotateCwIcon,
  RouteIcon,
  ScanFaceIcon,
  ScanTextIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShipIcon,
  SlidersHorizontalIcon,
  SmartphoneChargingIcon,
  SmartphoneNfcIcon,
  SmileIcon,
  SmilePlusIcon,
  SnowflakeIcon,
  SparklesIcon,
  SquareActivityIcon,
  SquareArrowDownIcon,
  SquareArrowLeftIcon,
  SquareArrowRightIcon,
  SquareArrowUpIcon,
  SquareChevronDownIcon,
  SquareChevronLeftIcon,
  SquareChevronRightIcon,
  SquareChevronUpIcon,
  SquarePenIcon,
  SquareStackIcon,
  SunIcon,
  SunDimIcon,
  SunMediumIcon,
  SunMoonIcon,
  SunsetIcon,
  TelescopeIcon,
  TerminalIcon,
  ThermometerIcon,
  TimerIcon,
  TornadoIcon,
  TrainTrackIcon,
  TrendingDownIcon,
  TrendingUpDownIcon,
  TrendingUpIcon,
  TruckIcon,
  TwitchIcon,
  TwitterIcon,
  UnderlineIcon,
  UndoIcon,
  UndoDotIcon,
  UploadIcon,
  UserIcon,
  UserCheckIcon,
  UserRoundCheckIcon,
  UserRoundPlusIcon,
  UsersIcon,
  VolumeIcon,
  WavesIcon,
  WavesLadderIcon,
  WaypointsIcon,
  WebhookIcon,
  WifiIcon,
  WindIcon,
  WorkflowIcon,
  WrenchIcon,
  XIcon,
  YoutubeIcon,
  ZapIcon,
  ZapOffIcon,
} from 'lucide-animated';

// Type for animated icon handle (for programmatic animation control)
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

// Shared props for all re-exported icons
export interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  strokeWidth?: number;
  fill?: string;
  color?: string;
}

// ============================================================================
// Helper to wrap lucide-animated icons with auto-hover animation
// ============================================================================
function createAnimatedIcon(Component: React.ForwardRefExoticComponent<any>) {
  const WrappedIcon = React.forwardRef<AnimatedIconHandle, IconProps>((props, ref) => {
    const internalRef = React.useRef<AnimatedIconHandle>(null);

    React.useImperativeHandle(ref, () => ({
      startAnimation: () => internalRef.current?.startAnimation(),
      stopAnimation: () => internalRef.current?.stopAnimation(),
    }));

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      internalRef.current?.startAnimation();
      props.onMouseEnter?.(e as any);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      internalRef.current?.stopAnimation();
      props.onMouseLeave?.(e as any);
    };

    return React.createElement(Component, {
      ...props,
      ref: internalRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    });
  });

  WrappedIcon.displayName = (Component as any).displayName || 'AnimatedIcon';
  return WrappedIcon;
}

// ============================================================================
// Re-export animated icons with lucide-react compatible names
// ============================================================================
export const Activity = createAnimatedIcon(ActivityIcon);
export const Plane = createAnimatedIcon(AirplaneIcon);
export const ArrowDown = createAnimatedIcon(ArrowDownIcon);
export const ArrowDownLeft = createAnimatedIcon(ArrowDownLeftIcon);
export const ArrowDownRight = createAnimatedIcon(ArrowDownRightIcon);
export const ArrowLeft = createAnimatedIcon(ArrowLeftIcon);
export const ArrowRight = createAnimatedIcon(ArrowRightIcon);
export const ArrowUp = createAnimatedIcon(ArrowUpIcon);
export const ArrowUpLeft = createAnimatedIcon(ArrowUpLeftIcon);
export const ArrowUpRight = createAnimatedIcon(ArrowUpRightIcon);
export const Ban = createAnimatedIcon(BanIcon);
export const Bell = createAnimatedIcon(BellIcon);
export const CalendarCheck = createAnimatedIcon(CalendarCheckIcon);
export const Calendar = createAnimatedIcon(CalendarDaysIcon);
export const CalendarDays = createAnimatedIcon(CalendarDaysIcon);
export const Check = createAnimatedIcon(CheckIcon);
export const CheckCheck = createAnimatedIcon(CheckCheckIcon);
export const ChevronDown = createAnimatedIcon(ChevronDownIcon);
export const ChevronFirst = createAnimatedIcon(ChevronFirstIcon);
export const ChevronLeft = createAnimatedIcon(ChevronLeftIcon);
export const ChevronRight = createAnimatedIcon(ChevronRightIcon);
export const ChevronUp = createAnimatedIcon(ChevronUpIcon);
export const ChevronsUpDown = createAnimatedIcon(ChevronsUpDownIcon);
export const CheckCircle = createAnimatedIcon(CircleCheckIcon);
export const CheckCircle2 = createAnimatedIcon(CircleCheckBigIcon);
export const Circle = createAnimatedIcon(CircleDashedIcon);
export const CreditCard = createAnimatedIcon(CircleDollarSignIcon);
export const AlertCircle = createAnimatedIcon(CircleHelpIcon);
export const Info = createAnimatedIcon(CircleHelpIcon);
export const ClipboardCheck = createAnimatedIcon(ClipboardCheckIcon);
export const Clock = createAnimatedIcon(ClockIcon);
export const Settings2 = createAnimatedIcon(CogIcon);
export const Navigation = createAnimatedIcon(CompassIcon);
export const Copy = createAnimatedIcon(CopyIcon);
export const MousePointerClick = createAnimatedIcon(CursorClickIcon);
export const Database = createAnimatedIcon(DatabaseIcon);
export const Trash2 = createAnimatedIcon(DeleteIcon);
export const DollarSign = createAnimatedIcon(DollarSignIcon);
export const Download = createAnimatedIcon(DownloadIcon);
export const Globe = createAnimatedIcon(EarthIcon);
export const Eye = createAnimatedIcon(EyeIcon);
export const EyeOff = createAnimatedIcon(EyeOffIcon);
export const Facebook = createAnimatedIcon(FacebookIcon);
export const FileText = createAnimatedIcon(FileChartLineIcon);
export const FileCheck = createAnimatedIcon(FileCheckIcon);
export const FileCheck2 = createAnimatedIcon(FileCheck2Icon);
export const FileCog = createAnimatedIcon(FileCogIcon);
export const FilePenLine = createAnimatedIcon(FilePenLineIcon);
export const FileStack = createAnimatedIcon(FileStackIcon);
export const Fingerprint = createAnimatedIcon(FingerprintIcon);
export const Flame = createAnimatedIcon(FlameIcon);
export const FolderArchive = createAnimatedIcon(FolderArchiveIcon);
export const FolderCheck = createAnimatedIcon(FolderCheckIcon);
export const FolderClock = createAnimatedIcon(FolderClockIcon);
export const FolderCode = createAnimatedIcon(FolderCodeIcon);
export const FolderCog = createAnimatedIcon(FolderCogIcon);
export const FolderDown = createAnimatedIcon(FolderDownIcon);
export const FolderGit = createAnimatedIcon(FolderGitIcon);
export const FolderGit2 = createAnimatedIcon(FolderGit2Icon);
export const FolderHeart = createAnimatedIcon(FolderHeartIcon);
export const FolderInput = createAnimatedIcon(FolderInputIcon);
export const FolderKanban = createAnimatedIcon(FolderKanbanIcon);
export const FolderKey = createAnimatedIcon(FolderKeyIcon);
export const FolderLock = createAnimatedIcon(FolderLockIcon);
export const FolderMinus = createAnimatedIcon(FolderMinusIcon);
export const FolderOpen = createAnimatedIcon(FolderOpenIcon);
export const FolderOutput = createAnimatedIcon(FolderOutputIcon);
export const FolderPlus = createAnimatedIcon(FolderPlusIcon);
export const FolderRoot = createAnimatedIcon(FolderRootIcon);
export const FolderSync = createAnimatedIcon(FolderSyncIcon);
export const FolderTree = createAnimatedIcon(FolderTreeIcon);
export const FolderUp = createAnimatedIcon(FolderUpIcon);
export const FolderX = createAnimatedIcon(FolderXIcon);
export const Folders = createAnimatedIcon(FoldersIcon);
export const Github = createAnimatedIcon(GithubIcon);
export const Gitlab = createAnimatedIcon(GitlabIcon);
export const GripHorizontal = createAnimatedIcon(GripHorizontalIcon);
export const GripVertical = createAnimatedIcon(GripVerticalIcon);
export const Grip = createAnimatedIcon(GripHorizontalIcon);
export const HandCoins = createAnimatedIcon(HandCoinsIcon);
export const Heart = createAnimatedIcon(HeartIcon);
export const HeartHandshake = createAnimatedIcon(HeartHandshakeIcon);
export const History = createAnimatedIcon(HistoryIcon);
export const Home = createAnimatedIcon(HomeIcon);
export const Hourglass = createAnimatedIcon(HourglassIcon);
export const IdCard = createAnimatedIcon(IdCardIcon);
export const Instagram = createAnimatedIcon(InstagramIcon);
export const Key = createAnimatedIcon(KeyIcon);
export const KeyCircle = createAnimatedIcon(KeyCircleIcon);
export const Keyboard = createAnimatedIcon(KeyboardIcon);
export const Languages = createAnimatedIcon(LanguagesIcon);
export const Layers = createAnimatedIcon(LayersIcon);
export const LayoutDashboard = createAnimatedIcon(LayoutPanelTopIcon);
export const Link = createAnimatedIcon(LucideAnimatedLinkIcon);
export const LinkIcon = createAnimatedIcon(LucideAnimatedLinkIcon);
export const Linkedin = createAnimatedIcon(LinkedinIcon);
export const ListFilter = createAnimatedIcon(ListIcon);
export const Loader2 = createAnimatedIcon(LoaderPinwheelIcon);
export const Lock = createAnimatedIcon(LockIcon);
export const LockKeyhole = createAnimatedIcon(LockKeyholeIcon);
export const LockKeyholeOpen = createAnimatedIcon(LockKeyholeOpenIcon);
export const LockOpen = createAnimatedIcon(LockOpenIcon);
export const LogOut = createAnimatedIcon(LogoutIcon);
export const Mail = createAnimatedIcon(MailCheckIcon);
export const MapPin = createAnimatedIcon(MapPinIcon);
export const Maximize2 = createAnimatedIcon(Maximize2Icon);
export const Menu = createAnimatedIcon(MenuIcon);
export const MessageCircle = createAnimatedIcon(MessageCircleIcon);
export const MessageCircleDashed = createAnimatedIcon(MessageCircleDashedIcon);
export const MessageCircleMore = createAnimatedIcon(MessageCircleMoreIcon);
export const MessageSquare = createAnimatedIcon(MessageSquareIcon);
export const MessageSquareDashed = createAnimatedIcon(MessageSquareDashedIcon);
export const MessageSquareMore = createAnimatedIcon(MessageSquareMoreIcon);
export const Mic = createAnimatedIcon(MicIcon);
export const MicOff = createAnimatedIcon(MicOffIcon);
export const Minimize = createAnimatedIcon(MinimizeIcon);
export const Moon = createAnimatedIcon(MoonIcon);
export const Gift = createAnimatedIcon(PartyPopperIcon);
export const Pause = createAnimatedIcon(PauseIcon);
export const Pencil = createAnimatedIcon(PenToolIcon);
export const Play = createAnimatedIcon(PlayIcon);
export const Plus = createAnimatedIcon(PlusIcon);
export const Radio = createAnimatedIcon(RadioIcon);
export const RadioTower = createAnimatedIcon(RadioTowerIcon);
export const Redo = createAnimatedIcon(RedoIcon);
export const RedoDot = createAnimatedIcon(RedoDotIcon);
export const RefreshCw = createAnimatedIcon(RefreshCwIcon);
export const RefreshCcw = createAnimatedIcon(RefreshCcwIcon);
export const RotateCcw = createAnimatedIcon(RotateCcwIcon);
export const RotateCw = createAnimatedIcon(RotateCwIcon);
export const Route = createAnimatedIcon(RouteIcon);
export const ScanFace = createAnimatedIcon(ScanFaceIcon);
export const ScanText = createAnimatedIcon(ScanTextIcon);
export const Search = createAnimatedIcon(SearchIcon);
export const Settings = createAnimatedIcon(SettingsIcon);
export const ShieldCheck = createAnimatedIcon(ShieldCheckIcon);
export const Shield = createAnimatedIcon(ShieldCheckIcon);
export const Ship = createAnimatedIcon(ShipIcon);
export const Filter = createAnimatedIcon(SlidersHorizontalIcon);
export const Smartphone = createAnimatedIcon(SmartphoneChargingIcon);
export const Smile = createAnimatedIcon(SmileIcon);
export const SmilePlus = createAnimatedIcon(SmilePlusIcon);
export const Snowflake = createAnimatedIcon(SnowflakeIcon);
export const Sparkles = createAnimatedIcon(SparklesIcon);
export const SquareActivity = createAnimatedIcon(SquareActivityIcon);
export const SquareArrowDown = createAnimatedIcon(SquareArrowDownIcon);
export const SquareArrowLeft = createAnimatedIcon(SquareArrowLeftIcon);
export const SquareArrowRight = createAnimatedIcon(SquareArrowRightIcon);
export const SquareArrowUp = createAnimatedIcon(SquareArrowUpIcon);
export const SquareChevronDown = createAnimatedIcon(SquareChevronDownIcon);
export const SquareChevronLeft = createAnimatedIcon(SquareChevronLeftIcon);
export const SquareChevronRight = createAnimatedIcon(SquareChevronRightIcon);
export const SquareChevronUp = createAnimatedIcon(SquareChevronUpIcon);
export const Edit = createAnimatedIcon(SquarePenIcon);
export const SquareStack = createAnimatedIcon(SquareStackIcon);
export const Sun = createAnimatedIcon(SunIcon);
export const SunDim = createAnimatedIcon(SunDimIcon);
export const SunMedium = createAnimatedIcon(SunMediumIcon);
export const SunMoon = createAnimatedIcon(SunMoonIcon);
export const Sunset = createAnimatedIcon(SunsetIcon);
export const Telescope = createAnimatedIcon(TelescopeIcon);
export const Terminal = createAnimatedIcon(TerminalIcon);
export const Thermometer = createAnimatedIcon(ThermometerIcon);
export const Timer = createAnimatedIcon(TimerIcon);
export const Tornado = createAnimatedIcon(TornadoIcon);
export const TrainTrack = createAnimatedIcon(TrainTrackIcon);
export const TrendingDown = createAnimatedIcon(TrendingDownIcon);
export const TrendingUpDown = createAnimatedIcon(TrendingUpDownIcon);
export const TrendingUp = createAnimatedIcon(TrendingUpIcon);
export const Truck = createAnimatedIcon(TruckIcon);
export const Car = createAnimatedIcon(TruckIcon);
export const Twitch = createAnimatedIcon(TwitchIcon);
export const Twitter = createAnimatedIcon(TwitterIcon);
export const Underline = createAnimatedIcon(UnderlineIcon);
export const Undo = createAnimatedIcon(UndoIcon);
export const UndoDot = createAnimatedIcon(UndoDotIcon);
export const Upload = createAnimatedIcon(UploadIcon);
export const User = createAnimatedIcon(UserIcon);
export const UserCheck = createAnimatedIcon(UserCheckIcon);
export const UserRoundCheck = createAnimatedIcon(UserRoundCheckIcon);
export const UserRoundPlus = createAnimatedIcon(UserRoundPlusIcon);
export const Users = createAnimatedIcon(UsersIcon);
export const Volume = createAnimatedIcon(VolumeIcon);
export const Waves = createAnimatedIcon(WavesIcon);
export const WavesLadder = createAnimatedIcon(WavesLadderIcon);
export const Waypoints = createAnimatedIcon(WaypointsIcon);
export const Webhook = createAnimatedIcon(WebhookIcon);
export const Wifi = createAnimatedIcon(WifiIcon);
export const Wind = createAnimatedIcon(WindIcon);
export const Workflow = createAnimatedIcon(WorkflowIcon);
export const Wrench = createAnimatedIcon(WrenchIcon);
export const X = createAnimatedIcon(XIcon);
export const Youtube = createAnimatedIcon(YoutubeIcon);
export const Zap = createAnimatedIcon(ZapIcon);
export const ZapOff = createAnimatedIcon(ZapOffIcon);

// ============================================================================
// Aliases for lucide-react names that differ in lucide-animated
// ============================================================================
export { Plane as Airplane };

// ============================================================================
// Animated Hotel icon (using CSS animation since lucide-animated doesn't have it)
// ============================================================================
const HotelWithAnimation = React.forwardRef<SVGSVGElement, React.ComponentProps<typeof HotelBase>>((props, ref) => {
  return React.createElement(HotelBase, {
    ...props,
    ref,
    className: `transition-transform duration-300 hover:scale-110 hover:rotate-6 ${props.className || ''}`,
  });
});
HotelWithAnimation.displayName = 'Hotel';

export const Hotel = HotelWithAnimation;

// ============================================================================
// Fallback icons from lucide-react (not available in lucide-animated)
// ============================================================================
export {
  AlertTriangle,
  Armchair,
  Archive,
  ArrowUpDown,
  BarChart,
  BarChart3,
  Bed,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  CheckSquare,
  ExternalLink,
  File,
  Folder,
  Gauge,
  GitBranch,
  GitMerge,
  HelpCircle,
  Image,
  LayoutGrid,
  Link2,
  ListTodo,
  LogIn,
  Luggage,
  Megaphone,
  Minus,
  Monitor,
  MoreHorizontal,
  MoreVertical,
  Package,
  Palette,
  Paperclip,
  Phone,
  PieChart,
  Repeat,
  Save,
  Send,
  Server,
  ServerCrash,
  Share2,
  ShieldAlert,
  ShieldQuestion,
  ShoppingCart,
  Star,
  Tag,
  Target,
  Ticket,
  Type,
  Utensils,
  Printer,
  Map,
  UserPlus,
  UserX,
  Wallet,
  XCircle,
  ArrowLeftRight,
  ArrowRightLeft,
  BaggageClaim,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudFog,
  Cloudy,
  Droplets,
  Umbrella,
  Frown,
  SlidersHorizontal,
  Dumbbell,
  Accessibility,
  Baby,
  Coffee,
  Tv,
  Dog,
  BadgeCheck,
  PlayCircle,
  Sunrise,
  Inbox,
  PartyPopper,
  Calculator,
  Diamond,
  ShoppingBag,
  Edit3,
  List,
  Grid3X3,
} from 'lucide-react';

// Aliases for alternative naming conventions
export { Edit as Edit2 };

// Re-export LucideIcon type from lucide-react for type compatibility
export type { LucideIcon } from 'lucide-react';
