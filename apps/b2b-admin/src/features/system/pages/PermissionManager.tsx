import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Label } from "@tripalfa/ui-components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select";
import { Switch } from "@tripalfa/ui-components/ui/switch";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { routeConfig } from "@/config/routing";

const STORAGE_KEY = "b2b_admin_role_permissions";
const ROLES = ["ADMIN", "B2B", "VIEWER"] as const;

type RoleName = (typeof ROLES)[number];

type ModulePermission = {
  module: string;
  path: string;
  permissions: string[];
};

function getDefaultRolePermissions(): Record<RoleName, string[]> {
  const modulePermissions = routeConfig
    .flatMap((route) => route.permissions ?? [])
    .filter(
      (permission, index, arr) =>
        permission && arr.indexOf(permission) === index,
    );

  return {
    ADMIN: modulePermissions,
    B2B: modulePermissions.filter(
      (permission) => !permission.includes(":manage"),
    ),
    VIEWER: modulePermissions.filter((permission) =>
      permission.includes(":view"),
    ),
  };
}

function readRolePermissions(): Record<RoleName, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultRolePermissions();
    const parsed = JSON.parse(raw) as Record<string, string[]>;

    return {
      ADMIN: Array.isArray(parsed.ADMIN) ? parsed.ADMIN : [],
      B2B: Array.isArray(parsed.B2B) ? parsed.B2B : [],
      VIEWER: Array.isArray(parsed.VIEWER) ? parsed.VIEWER : [],
    };
  } catch {
    return getDefaultRolePermissions();
  }
}

export default function PermissionManager() {
  const [selectedRole, setSelectedRole] = useState<RoleName>("ADMIN");
  const [rolePermissions, setRolePermissions] =
    useState<Record<RoleName, string[]>>(readRolePermissions);

  const modules = useMemo<ModulePermission[]>(() => {
    return routeConfig
      .filter(
        (route) =>
          route.path !== "/" &&
          route.permissions &&
          route.permissions.length > 0,
      )
      .map((route) => ({
        module: route.label,
        path: route.path,
        permissions: route.permissions ?? [],
      }));
  }, []);

  const hasPermission = (permission: string) =>
    rolePermissions[selectedRole].includes(permission);

  const setPermission = (permission: string, enabled: boolean) => {
    setRolePermissions((prev) => {
      const current = prev[selectedRole];
      const next = enabled
        ? Array.from(new Set([...current, permission]))
        : current.filter((item) => item !== permission);

      return {
        ...prev,
        [selectedRole]: next,
      };
    });
  };

  const setModulePermissions = (permissions: string[], enabled: boolean) => {
    permissions.forEach((permission) => setPermission(permission, enabled));
  };

  const handleReset = () => {
    const defaults = getDefaultRolePermissions();
    setRolePermissions(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    toast.success("Permission matrix reset to defaults");
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rolePermissions));
    toast.success("Permission assignments saved");
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Permission Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign module-level view/edit access by role. Changes apply across
            all B2B admin modules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Role Selection</CardTitle>
          <CardDescription>
            Choose which access level to configure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-xs">
            <Label htmlFor="roleSelect">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as RoleName)}
            >
              <SelectTrigger id="roleSelect" className="mt-2">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Module Access Matrix</CardTitle>
          <CardDescription>
            Toggle permissions for each module. Manage/edit access is controlled
            by `:manage` permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {modules.map((module) => {
            const moduleEnabled = module.permissions.every((permission) =>
              hasPermission(permission),
            );

            return (
              <div
                key={module.path}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {module.module}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {module.path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {module.permissions.length} permissions
                    </Badge>
                    <Switch
                      checked={moduleEnabled}
                      onCheckedChange={(value) =>
                        setModulePermissions(module.permissions, value)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {module.permissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between rounded-md border px-3 py-2 gap-2"
                    >
                      <Label
                        htmlFor={`${module.path}-${permission}`}
                        className="text-xs font-medium"
                      >
                        {permission}
                      </Label>
                      <Switch
                        id={`${module.path}-${permission}`}
                        checked={hasPermission(permission)}
                        onCheckedChange={(value) =>
                          setPermission(permission, value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
