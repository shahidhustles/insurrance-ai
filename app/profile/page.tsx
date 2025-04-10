"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const ProfilePage = () => {
  const [role, setRole] = useState<"customer" | "insurer">("customer");
  const [roleSelected, setRoleSelected] = useState(false);
  const router = useRouter();
  const { user } = useUser();
  const addCustomer = useMutation(api.customers.add);
  const addInsurer = useMutation(api.insurers.add);
  const [customerForm, setCustomerForm] = useState({
    age: "",
    occupation: "",
    incomeRange: "",
    city: "",
    state: "",
    riskAppetite: "medium",
  });

  // Insurer form state
  const [insurerForm, setInsurerForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
  });

  async function handleSubmit() {
    if (role === "customer") {
      await addCustomer({
        ...customerForm,
        age: parseInt(customerForm.age, 10) || 0,
        name: user?.firstName || "",
        userId: user?.id || "",
      });
    } else {
      await addInsurer({
        ...insurerForm,
        userId: user?.id || "",
      });
    }
    router.push(`/dashboard/${user?.id}`);
  }

  const handleRoleSelect = (value: "customer" | "insurer") => {
    setRole(value);
  };

  const handleRoleConfirm = () => {
    setRoleSelected(true);
  };

  const handleCustomerFormChange = (field: string, value: string) => {
    setCustomerForm({
      ...customerForm,
      [field]: value,
    });
  };

  const handleInsurerFormChange = (field: string, value: string) => {
    setInsurerForm({
      ...insurerForm,
      [field]: value,
    });
  };

  return (
    <div className="container mx-auto py-10 min-h-screen flex flex-col items-center">
      <motion.div
        className="w-full max-w-md"
        initial={{ y: roleSelected ? 0 : "30vh", scale: 1 }}
        animate={{
          y: roleSelected ? 0 : "30vh",
          scale: roleSelected ? 0.9 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Select Your Role</CardTitle>
            <CardDescription className="text-center">
              Are you a customer or an insurer?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={role}
              onValueChange={(value: "customer" | "insurer") =>
                handleRoleSelect(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="insurer">Insurer</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleRoleConfirm}>
              Confirm Role
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {roleSelected && (
        <motion.div
          className="w-full max-w-2xl mt-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {role === "customer" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      value={customerForm.age}
                      onChange={(e) =>
                        handleCustomerFormChange("age", e.target.value)
                      }
                      placeholder="Enter your age"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={customerForm.occupation}
                      onChange={(e) =>
                        handleCustomerFormChange("occupation", e.target.value)
                      }
                      placeholder="Enter your occupation"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="income">Income Range</Label>
                  <Select
                    value={customerForm.incomeRange}
                    onValueChange={(value) =>
                      handleCustomerFormChange("incomeRange", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-25000">₹0 - ₹25,000</SelectItem>
                      <SelectItem value="25001-50000">
                        ₹25,001 - ₹50,000
                      </SelectItem>
                      <SelectItem value="50001-75000">
                        ₹50,001 - ₹75,000
                      </SelectItem>
                      <SelectItem value="75001-100000">
                        ₹75,001 - ₹100,000
                      </SelectItem>
                      <SelectItem value="100001+">₹100,001+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={customerForm.city}
                      onChange={(e) =>
                        handleCustomerFormChange("city", e.target.value)
                      }
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={customerForm.state}
                      onChange={(e) =>
                        handleCustomerFormChange("state", e.target.value)
                      }
                      placeholder="Enter your state"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Risk Appetite</Label>
                  <RadioGroup
                    value={customerForm.riskAppetite}
                    onValueChange={(value: string) =>
                      handleCustomerFormChange("riskAppetite", value)
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high">High</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleSubmit}>
                  Save Profile
                </Button>
              </CardFooter>
            </Card>
          )}

          {role === "insurer" && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Insurer Information</CardTitle>
                <CardDescription>Tell us about your company</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={insurerForm.companyName}
                    onChange={(e) =>
                      handleInsurerFormChange("companyName", e.target.value)
                    }
                    placeholder="Enter your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={insurerForm.email}
                    onChange={(e) =>
                      handleInsurerFormChange("email", e.target.value)
                    }
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={insurerForm.phone}
                    onChange={(e) =>
                      handleInsurerFormChange("phone", e.target.value)
                    }
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={insurerForm.address}
                    onChange={(e) =>
                      handleInsurerFormChange("address", e.target.value)
                    }
                    placeholder="Enter your company address"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Save Company Profile</Button>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
