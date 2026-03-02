"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@tripalfa/ui-components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@tripalfa/ui-components/ui/form";
import { Input } from "@tripalfa/ui-components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tripalfa/ui-components/ui/select";
import { DialogFooter } from "@tripalfa/ui-components/ui/dialog";

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    email: z.string().email(),
    role: z.enum(["admin", "user", "manager"]),
    userType: z.enum(["staff", "b2b", "b2c"]),
    companyId: z.string().optional(),
    branchId: z.string().optional(),
    departmentId: z.string().optional(),
    designationId: z.string().optional(),
    phone: z.string().optional(),
    cardProvider: z.string().optional(),
    cardLast4: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardDocument: z.any().optional(),
  })
  .refine(
    (vals) => {
      if (vals.userType === "staff") {
        return Boolean(
          vals.companyId &&
          vals.branchId &&
          vals.departmentId &&
          vals.designationId,
        );
      }
      if (vals.userType === "b2b") {
        return Boolean(vals.companyId);
      }
      return true;
    },
    {
      message: "Please complete required fields for the selected user type.",
      path: ["userType"],
    },
  );

interface UserFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  initialData?: z.infer<typeof formSchema>;
  companies: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  designations: { id: string; name: string }[];
  isSubmitting?: boolean;
}

export function UserForm({
  onSubmit,
  initialData,
  companies,
  branches,
  departments,
  designations,
  isSubmitting = false,
}: UserFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      role: "user",
      userType: "staff",
      companyId: "",
      branchId: "",
      departmentId: "",
      designationId: "",
      phone: "",
      cardProvider: "",
      cardLast4: "",
      cardExpiry: "",
      cardDocument: null,
    },
  });

  const userType = form.watch("userType");
  const disabled = isSubmitting;

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="john@example.com"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="staff">Staff (internal)</SelectItem>
                  <SelectItem value="b2b">B2B (agency user)</SelectItem>
                  <SelectItem value="b2c">B2C (consumer)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Fields below adjust based on user type.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {(userType === "staff" || userType === "b2b") && (
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {userType === "staff" && (
          <>
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {designations.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {userType === "b2c" && (
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 555 0100"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>
                  Optional contact for B2C profiles.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-2 rounded-md border border-dashed p-3">
          <p className="text-sm font-semibold text-foreground">
            Virtual corporate card (optional)
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField
              control={form.control}
              name="cardProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Visa / Mastercard / Amex"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardLast4"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last 4</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={4}
                      placeholder="1234"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cardExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry</FormLabel>
                  <FormControl>
                    <Input placeholder="MM/YY" {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="cardDocument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card proof / PDF</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      field.onChange(e.target.files?.[0] ?? null)
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>
                  Attach the virtual card document if available.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={disabled}>
            {disabled ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
