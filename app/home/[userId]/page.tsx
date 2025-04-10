"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

const Home = ({ params }: { params: Promise<{ userId: string }> }) => {
  const resolvedParams = React.use(params);
  const { userId } = resolvedParams;
  const router = useRouter();
  const role = useQuery(api.users.getUserRole, {
    userId,
  });

  const customer = useQuery(api.customers.getByUserId, {
    userId,
  });

  return (
    <main className="mx-auto p-6 max-w-4xl">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 w-full">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Personalized Recommendations
        </h3>
        <div className="bg-gray-50 p-6 rounded text-gray-500 text-center">
          {role === undefined ? (
            <div className="animate-pulse">Loading recommendations...</div>
          ) : customer?.pastPolicies && customer?.pastPolicies?.length > 3 ? (
            <p>Recommended policies are:</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p>
                Upload more {3 - (customer?.pastPolicies?.length || 0)} of your
                current policies to get personalized recommendations
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
