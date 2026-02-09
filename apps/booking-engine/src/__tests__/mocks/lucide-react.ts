// Mock lucide-react icons for testing
const createMockIcon = (name: string) => {
  const Component = (props: any) => {
    return null;
  };
  Component.displayName = name;
  return Component;
};

export const X = createMockIcon('X');
export const CheckCircle2 = createMockIcon('CheckCircle2');
export const Check = createMockIcon('Check');
export const Clock = createMockIcon('Clock');
export const XCircle = createMockIcon('XCircle');
export const Info = createMockIcon('Info');
export const Calendar = createMockIcon('Calendar');
export const Shield = createMockIcon('Shield');
export const Bell = createMockIcon('Bell');
export const AlertCircle = createMockIcon('AlertCircle');
export const Inbox = createMockIcon('Inbox');
export const Archive = createMockIcon('Archive');
export const Trash2 = createMockIcon('Trash2');
export const MoreVertical = createMockIcon('MoreVertical');
export const ChevronDown = createMockIcon('ChevronDown');
export const ChevronUp = createMockIcon('ChevronUp');
export const Search = createMockIcon('Search');
export const Filter = createMockIcon('Filter');
export const Loader2 = createMockIcon('Loader2');

export default {
  X,
  CheckCircle2,
  Check,
  Clock,
  XCircle,
  Info,
  Calendar,
  Shield,
  Bell,
  AlertCircle,
  Inbox,
  Archive,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Loader2,
};
