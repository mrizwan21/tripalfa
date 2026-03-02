import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@tripalfa/ui-components/ui/badge";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user" | "staff";
  userType: "staff" | "b2b" | "b2c";
  status: "active" | "inactive" | "suspended";
  createdAt: string;
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <Badge variant={role === "admin" ? "default" : "secondary"}>
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: "userType",
    header: "Type",
    cell: ({ row }) => {
      const userType = row.getValue("userType") as string;
      return (
        <Badge
          variant={
            userType === "staff"
              ? "default"
              : userType === "b2b"
                ? "secondary"
                : "outline"
          }
        >
          {userType}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "inactive"
                ? "secondary"
                : "destructive"
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
];
