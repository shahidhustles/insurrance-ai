"use client";

import { useQuery } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IconArrowLeft } from "@tabler/icons-react";

export default function PolicyComparisonPage() {
  const router = useRouter();
  const params = useParams();
  const policyId = params.policyId as Id<"policies">;
  const comparePolicyId = params.comparePolicyId as Id<"policies">;
  
  // Fetch both policies
  const policy1 = useQuery(api.policies.getById, { id: policyId });
  const policy2 = useQuery(api.policies.getById, { id: comparePolicyId });


 

  const handleBack = () => {
    router.back();
  };

  // Function to render a policy value with visual comparison
  const renderComparisonValue = (
    value1: string | undefined,
    value2: string | undefined
  ) => {
    const val1 = value1 || "Not specified";
    const val2 = value2 || "Not specified";

    let className1 = "";
    let className2 = "";

    // Only highlight differences when both values are specified
    if (value1 && value2 && value1 !== value2) {
      // Simple numeric comparison for premium and sum insured
      if (
        val1.includes("₹") ||
        val2.includes("₹") ||
        val1.includes("Rs") ||
        val2.includes("Rs")
      ) {
        const num1 = parseFloat(val1.replace(/[^0-9.]/g, ""));
        const num2 = parseFloat(val2.replace(/[^0-9.]/g, ""));

        if (!isNaN(num1) && !isNaN(num2)) {
          if (num1 < num2) {
            className1 = "text-green-600 font-semibold";
            className2 = "text-red-600";
          } else if (num1 > num2) {
            className1 = "text-red-600";
            className2 = "text-green-600 font-semibold";
          }
        }
      } else {
        className1 = "text-blue-600";
        className2 = "text-blue-600";
      }
    }

    return { val1, val2, className1, className2 };
  };

  if (!policy1 || !policy2) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="outline" onClick={handleBack} className="mb-6">
          <IconArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="p-6">
          <p className="text-center">Loading policy comparison...</p>
        </Card>
      </div>
    );
  }

  // If the policies are of different types, show warning and option to go back
  if (policy1.type !== policy2.type) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button variant="outline" onClick={handleBack} className="mb-6">
          <IconArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Cannot compare policies of different types
            </h2>
            <p className="mb-6">
              {policy1.name} is a {policy1.type} policy while {policy2.name} is
              a {policy2.type} policy.
            </p>
            <Button onClick={handleBack}>Return to previous page</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Comparison fields for different policy types
  const comparisonFields = [
    { key: "provider", label: "Provider" },
    { key: "premium", label: "Premium" },
    { key: "sumInsured", label: "Sum Insured", prefix: "₹" },
    { key: "years", label: "Duration" },
    { key: "expiryDate", label: "Expiry Date" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Button variant="outline" onClick={handleBack} className="mb-6">
        <IconArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold mb-6">Policy Comparison</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Policy 1 Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">{policy1.name}</h2>
          <p className="text-gray-500 capitalize mb-4">
            {policy1.provider || "Unknown Provider"} • {policy1.type} policy
          </p>
          <Separator className="my-4" />
          <p className="text-lg font-semibold mb-1">
            {policy1.premium || "Price not available"}
          </p>
          <p className="text-sm text-gray-500">
            Sum Insured: ₹{policy1.sumInsured || "Not specified"}
          </p>
        </Card>

        {/* Policy 2 Summary */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">{policy2.name}</h2>
          <p className="text-gray-500 capitalize mb-4">
            {policy2.provider || "Unknown Provider"} • {policy2.type} policy
          </p>
          <Separator className="my-4" />
          <p className="text-lg font-semibold mb-1">
            {policy2.premium || "Price not available"}
          </p>
          <p className="text-sm text-gray-500">
            Sum Insured: ₹{policy2.sumInsured || "Not specified"}
          </p>
        </Card>
      </div>

      {/* Main Comparison Table */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">
          Policy Details Comparison
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="font-medium text-gray-600">Feature</div>
          <div className="font-medium text-gray-600">{policy1.name}</div>
          <div className="font-medium text-gray-600">{policy2.name}</div>

          <Separator className="col-span-3" />

          {comparisonFields.map((field) => {
            const { val1, val2, className1, className2 } =
              renderComparisonValue(
                field.prefix
                  ? `${field.prefix}${policy1[field.key as keyof typeof policy1] || ""}`
                  : (policy1[field.key as keyof typeof policy1] as string),
                field.prefix
                  ? `${field.prefix}${policy2[field.key as keyof typeof policy2] || ""}`
                  : (policy2[field.key as keyof typeof policy2] as string)
              );

            return (
              <div key={field.label}>
                <div className="font-medium">{field.label}</div>
                <div className={className1}>{val1}</div>
                <div className={className2}>{val2}</div>
              </div>
            );
          })}
        </div>

        <h3 className="text-lg font-semibold mb-4">Policy Features</h3>
        <div className="grid grid-cols-2 gap-0 divide-x">
          <div className="pr-6">
            <h4 className="font-medium mb-2">{policy1.name}</h4>
            {policy1.features && policy1.features.length > 0 ? (
              <ul className="list-none space-y-2">
                {policy1.features.map((feature, idx) => (
                  <li key={idx} className="pb-2">
                    <div className="flex items-start">
                      <div className="min-h-[8px] min-w-[8px] h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{feature}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No features listed</p>
            )}
          </div>

          <div className="pl-6">
            <h4 className="font-medium mb-2">{policy2.name}</h4>
            {policy2.features && policy2.features.length > 0 ? (
              <ul className="list-none space-y-2">
                {policy2.features.map((feature, idx) => (
                  <li key={idx} className="pb-2">
                    <div className="flex items-start">
                      <div className="min-h-[8px] min-w-[8px] h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{feature}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No features listed</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
