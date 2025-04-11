"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

interface Policy {
  _id?: Id<"policies">;
  expiryDate: string;
  features: string[];
  name: string;
  premium: string;
  provider: string;
  storageId: string;
  sumInsured: string;
  type: string;
}

const Dashboard = ({ params }: { params: Promise<{ userId: string }> }) => {
  const resolvedParams = React.use(params);
  const { userId } = resolvedParams;
  const router = useRouter();

  const [policies, setPolicies] = useState<Policy[]>([]);

  const customer = useQuery(api.customers.getByUserId, {
    userId,
  });

  // Fetch all policies to get their IDs
  const allPolicies = useQuery(api.policies.getAll);

  useEffect(() => {
    if (customer?.pastPolicies && allPolicies) {
      // Enhance customer policies with their IDs from allPolicies
      const enhancedPolicies = customer.pastPolicies.map((policy) => {
        const matchedPolicy = allPolicies.find(
          (p) => p.storageId === policy.storageId
        );
        return {
          ...policy,
          _id: matchedPolicy?._id,
        };
      });
      setPolicies(enhancedPolicies);
    }
  }, [customer, allPolicies]);

  const handleViewDetails = (policyId: Id<"policies">) => {
    router.push(`/policy/${policyId}`);
  };

  return (
    <main className="mx-auto p-6 max-w-4xl">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Your Policies
        </h3>
        <div className="bg-gray-50 p-4 rounded text-gray-500">
          {policies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((policy) => (
                <div
                  key={policy.storageId}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-blue-600">
                      {policy.name}
                    </h4>
                    <span className="bg-blue-100 capitalize text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {policy.type}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 mb-2">
                    <p>
                      Provider:{" "}
                      <span className="font-medium">{policy.provider}</span>
                    </p>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Premium</span>
                      <span className="text-sm font-bold text-gray-800">
                        {policy.premium}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Sum Insured</span>
                      <span className="text-sm font-bold text-gray-800">
                        ₹{policy.sumInsured}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Expires</span>
                      <span
                        className={`text-sm font-medium ${
                          new Date(policy.expiryDate) <
                          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {new Date(policy.expiryDate).toLocaleDateString()}
                      </span>
                    </div>

                    {policy.features && policy.features.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">
                          Key Features:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {policy.features.slice(0, 3).map((feature, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                          {policy.features.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                              +{policy.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="w-full text-blue-600 hover:bg-blue-50"
                        onClick={() =>
                          policy._id && handleViewDetails(policy._id)
                        }
                        disabled={!policy._id}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">No policies uploaded yet.</div>
          )}
        </div>
      </div>
    </main>
  );
};
export default Dashboard;
