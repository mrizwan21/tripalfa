import * as React from "react";
import { Meta, StoryObj } from "@storybook/react";
import { FormField, FormFieldProps } from "./FormField";
import { 
  FiMail, 
  FiLock, 
  FiCheck, 
} from "react-icons/fi";

export default {
  title: "Components/FormField",
  component: FormField,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["b2b", "b2c", "admin"],
    },
    density: {
      control: { type: "select" },
      options: ["compact", "normal", "comfortable"],
    },
  },
} as Meta<typeof FormField>;

type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    type: "text",
    label: "Default Input",
    placeholder: "Enter text here",
    value: "",
    onChange: () => {},
  },
};

export const WithIcons: Story = {
  args: {
    type: "email",
    label: "Email with Icons",
    placeholder: "your@email.com",
    prefixIcon: <FiMail className="text-near-black" />,
    suffixIcon: <FiCheck className="text-apple-blue" />,
    variant: "b2c",
    value: "",
    onChange: () => {},
  },
};

export const ValidationStates: Story = {
  args: {
    type: "password",
    label: "Password Validation",
    placeholder: "Enter password",
    prefixIcon: <FiLock className="text-near-black" />,
    variant: "admin",
    value: "",
    onChange: () => {},
  },
  render: (args: any) => (
    <div className="space-y-6">
      <FormField {...args} error="Password is too short" touched />
      <FormField {...args} successMessage="Strong password!" valid touched />
    </div>
  ),
};

export const NewInputTypes: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <FormField 
        type="file" 
        label="Upload Document" 
        variant="b2b" 
        description="PDF, DOCX up to 10MB" 
        value=""
        onChange={() => {}}
      />
      <FormField 
        type="range" 
        label="Price Range" 
        value="75" 
        min="0" 
        max="100" 
        variant="b2c" 
        onChange={() => {}}
      />
      <FormField 
        type="color" 
        label="Theme Color" 
        value="#3b82f6" 
        variant="admin" 
        onChange={() => {}}
      />
    </div>
  ),
};