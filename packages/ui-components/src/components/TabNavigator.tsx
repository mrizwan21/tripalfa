import * as React from "react";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

export type TabNavigatorVariant = "b2b" | "b2c" | "admin";
export type TabNavigatorDensity = "compact" | "normal" | "comfortable";
export type TabNavigatorStyle = "underline" | "pills" | "cards";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  closeable?: boolean;
}

export interface TabNavigatorProps extends VariantProps<typeof tabVariants> {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  style?: TabNavigatorStyle;
  scrollable?: boolean;
  containerClassName?: string;
  children?: React.ReactNode;
}

const tabVariants = cva(
  "border-b transition-colors",
  {
    variants: {
      density: {
        compact: "px-4 py-2",
        normal: "px-6 py-4",
        comfortable: "px-8 py-6",
      },
    },
    defaultVariants: {
      density: "normal",
    },
  }
);

const densityStyles = {
  compact: { tab: "text-xs font-semibold px-3 py-2 gap-1.5", badge: "text-xs px-1.5 py-0.5" },
  normal: { tab: "text-sm font-semibold px-4 py-3 gap-2", badge: "text-xs px-2 py-1" },
  comfortable: { tab: "text-base font-semibold px-6 py-4 gap-2.5", badge: "text-sm px-2.5 py-1.5" },
};

export const TabNavigator = React.forwardRef<HTMLDivElement, TabNavigatorProps>(
  (
    {
      tabs = [],
      activeTabId,
      onTabChange,
      onTabClose,
      style = "underline",
      scrollable = false,
      density = "normal",
      containerClassName,
      children,
    },
    ref
  ) => {
    const styles = densityStyles[density || "normal"];
    const getTabStyles = (isActive: boolean, isDisabled: boolean) => {
      const baseStyles = cn(
        styles.tab,
        "flex items-center cursor-pointer transition-colors relative whitespace-nowrap",
        isDisabled && "opacity-50 cursor-not-allowed"
      );
      if (style === "underline") {
        return cn(
          baseStyles,
          "text-near-black hover:text-near-black",
          isActive && "text-apple-blue border-b-2 border-apple-blue"
        );
      }
      if (style === "pills") {
        return cn(
          baseStyles,
          "rounded-full",
          isActive ? "bg-apple-blue text-white" : "bg-light-gray text-near-black hover:bg-near-black/5"
        );
      }
      if (style === "cards") {
        return cn(
          baseStyles,
          "rounded-lg border",
          isActive ? "border-apple-blue bg-apple-blue/5 text-apple-blue" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
        );
      }
      return baseStyles;
    };

    return (
      <div ref={ref} className={cn(containerClassName)}>
        <div className={cn(tabVariants({ density }), "flex", scrollable ? "overflow-x-auto" : "flex-wrap")}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isDisabled = !!tab.disabled;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={getTabStyles(isActive, isDisabled)}
                role="tab"
                aria-selected={isActive}
              >
                {tab.icon && (
                  <span
                    className={cn(
                      density === "compact" && "h-4 w-4",
                      density === "normal" && "h-5 w-5",
                      density === "comfortable" && "h-6 w-6"
                    )}
                  >
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      styles.badge,
                      "rounded-full font-bold",
                      isActive ? "bg-white/30 text-white" : "bg-apple-blue/10 text-apple-blue"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
                {tab.closeable && onTabClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabClose(tab.id);
                    }}
                    className={cn(
                      "ml-1 p-0.5 rounded hover:bg-white/20",
                      density === "compact" && "h-3 w-3",
                      density === "normal" && "h-4 w-4",
                      density === "comfortable" && "h-5 w-5"
                    )}
                  >
                    <X className="h-full w-full" />
                  </button>
                )}
              </button>
            );
          })}
        </div>
        {children && (
          <div role="tabpanel" className="py-4">
            {children}
          </div>
        )}
      </div>
    );
  }
);

TabNavigator.displayName = "TabNavigator";
