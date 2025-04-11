"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

interface RecommendedPolicy {
  policyId: Id<"policies">;
  confidenceScore: number;
  summary: string;
  reasons: string[];
  benefitsForCustomer: string[];
}

const Home = ({ params }: { params: Promise<{ userId: string }> }) => {
  const resolvedParams = React.use(params);
  const { userId } = resolvedParams;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recommendedPolicies, setRecommendedPolicies] = useState<
    RecommendedPolicy[]
  >([]);

  const role = useQuery(api.users.getUserRole, {
    userId,
  });

  const customer = useQuery(api.customers.getByUserId, {
    userId,
  });

  const updateRecommendedPolicies = useMutation(
    api.customers.updateRecommendedPolicies
  );

  // Fetch policy data for the recommendations
  const policies = useQuery(api.policies.getAll);

  // Function to get recommendations from the API
  const getRecommendations = async () => {
    if (!customer?._id) return;

    try {
      setLoading(true);
      // Call the insurance-agent API
      const response = await fetch("/api/insurance-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();

      if (data?.recommendations && Array.isArray(data.recommendations)) {
        setRecommendedPolicies(data.recommendations);

        // Save recommendations to database
        await updateRecommendedPolicies({
          customerId: customer._id,
          recommendedPolicies: data.recommendations,
        });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run once when there's at least one past policy but no recommendations yet
  useEffect(() => {
    if (
      customer &&
      customer.pastPolicies &&
      customer.pastPolicies.length > 0 &&
      (!customer.recommendedPolicies ||
        customer.recommendedPolicies.length === 0) &&
      !loading
    ) {
      getRecommendations();
    } else if (
      customer?.recommendedPolicies &&
      customer.recommendedPolicies.length > 0
    ) {
      setRecommendedPolicies(customer.recommendedPolicies);
    }
  }, [customer]);

  // Helper function to get policy details
  const getPolicyDetails = (policyId: Id<"policies">) => {
    return policies?.find((policy) => policy._id === policyId);
  };

  return (
    <main className="mx-auto p-6 max-w-4xl">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 w-full">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Personalized Recommendations
        </h3>
        <div className="bg-gray-50 p-6 rounded text-gray-500">
          {role === undefined ? (
            <div className="animate-pulse">Loading recommendations...</div>
          ) : loading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Analyzing your policies to find the best recommendations...
              </p>
            </div>
          ) : customer?.pastPolicies && customer?.pastPolicies?.length > 0 ? (
            recommendedPolicies && recommendedPolicies.length > 0 ? (
              <div className="space-y-6">
                <p className="text-center text-gray-700 mb-4">
                  Based on your current policies, here are our personalized
                  recommendations:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedPolicies.map((recommendation, index) => {
                    const policy = getPolicyDetails(recommendation.policyId);
                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all p-4 flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-semibold text-blue-600">
                            {policy?.name || "Policy"}
                          </h4>
                          <span className="bg-blue-100 capitalize text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {policy?.type || "insurance"}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {recommendation.summary}
                        </p>

                        <div className="my-2">
                          <h5 className="text-xs uppercase font-semibold text-gray-500 mb-1">
                            Why this works for you:
                          </h5>
                          <ul className="text-xs text-gray-600 list-disc pl-4">
                            {recommendation.reasons
                              .slice(0, 2)
                              .map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                          </ul>
                        </div>

                        <div className="mt-auto">
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              Confidence
                            </span>
                            <span className="text-xs font-medium text-gray-700">
                              {recommendation.confidenceScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{
                                width: `${recommendation.confidenceScore}%`,
                              }}
                            ></div>
                          </div>

                          <Button
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                            size="sm"
                            onClick={() =>
                              router.push(`/policy/${policy?._id}`)
                            }
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-4">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => getRecommendations()}
                  >
                    Refresh Recommendations
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>Generating your personalized recommendations...</p>
                <Button
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => getRecommendations()}
                >
                  Get Recommendations
                </Button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>
                Upload at least one of your current policies to get personalized
                recommendations
              </p>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => router.push(`/upload/${userId}`)}
              >
                Upload Policies
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;
