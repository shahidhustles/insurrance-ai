"use client";

import { useQuery } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  IconDownload,
  IconArrowLeft,
  IconScale,
  IconRobot,
  IconSearch,
} from "@tabler/icons-react";
import { ConvexHttpClient } from "convex/browser";
import { Input } from "@/components/ui/input";
import { UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { useUser } from "@clerk/nextjs";

export default function PolicyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [isDownloading, setIsDownloading] = useState(false);
  const [openAIChat, setOpenAIChat] = useState(false);
  const [openCompareModal, setOpenCompareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const policyId = params.policyId as Id<"policies">;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get all policies for comparison
  const allPolicies = useQuery(api.policies.getAll) || [];
  const currentPolicy = useQuery(api.policies.getById, { id: policyId });

  // Filter policies by search query and same type
  const filteredPolicies = allPolicies.filter(
    (p) =>
      p._id !== policyId &&
      p.type === currentPolicy?.type &&
      (searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.provider &&
          p.provider.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    headers: policyId ? { "X-PolicyId": policyId } : undefined,
    onResponse: (response) => {
      const responsePolicyId = response.headers.get("X-PolicyId");
      if (responsePolicyId !== policyId) {
        console.log("New policy context detected:", responsePolicyId);
        // You could handle policy context changes here if needed
        // For example, redirect to a new policy page or update UI
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const policy = useQuery(api.policies.getById, { id: policyId });
  const { user } = useUser();
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (!policy?.storageId) {
        return;
      }
      const url = await convex.mutation(api.users.generateUrlForImage, {
        storageId: policy?.storageId,
      });
      router.push(url!);
    } catch (error) {
      console.error("Failed to download policy:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCompare = () => {
    setOpenCompareModal(true);
  };

  const navigateToComparison = (comparePolicyId: Id<"policies">) => {
    router.push(`/policy/compare/${policyId}/${comparePolicyId}`);
  };

  const handleBuyPolicy = async () => {
    if (!policy) return;

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policyId,
          policyName: policy.name,
          price: parseFloat((policy.premium || "0").replace(/[^0-9.]/g, "")), // Extract numeric value
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error initiating checkout:", error);
      alert("Failed to start checkout process. Please try again.");
    }
  };

  if (!policy) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="outline" onClick={handleBack} className="mb-6">
          <IconArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
            <Separator className="my-4" />
            <Skeleton className="h-4 w-1/4 mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="outline" onClick={handleBack} className="mb-6">
        <IconArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{policy.name}</h1>
            <p className="text-gray-500">
              Policy ID: <span className="font-medium">{policyId}</span>
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <Button variant="secondary" onClick={() => setOpenAIChat(true)}>
              <IconRobot className="mr-2 h-4 w-4" />
              Ask AI
            </Button>
            <span className="bg-blue-100 capitalize text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              {policy.type}
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Provider</p>
            <p className="text-lg font-semibold">
              {policy.provider || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Premium</p>
            <p className="text-lg font-semibold">
              {policy.premium || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Sum Insured</p>
            <p className="text-lg font-semibold">
              ₹{policy.sumInsured || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expiry</p>
            <p className="text-lg font-semibold capitalize">
              {typeof policy.years === "number" || policy.years
                ? `${policy.years} ${policy.years === "1" ? "year" : "years"} from purchase`
                : "Not specified"}
            </p>
          </div>
        </div>

        {policy.features && policy.features.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Policy Features</h3>
              <ul className="list-disc pl-5 space-y-1">
                {policy.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-700">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator className="my-4" />

        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={handleDownload} disabled={isDownloading}>
            <IconDownload className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
          <Button variant="outline" onClick={handleCompare}>
            <IconScale className="mr-2 h-4 w-4" />
            Compare with other policies
          </Button>
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleBuyPolicy()}
          >
            Buy Policy
          </Button>
        </div>
      </Card>

      {/* AI Chat Modal */}
      <Dialog open={openAIChat} onOpenChange={setOpenAIChat}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ask AI about this policy</DialogTitle>
          </DialogHeader>

          {/* Chat Messages with Markdown Support */}
          <div className="max-h-[350px] overflow-y-auto space-y-4 my-4 p-2 chat-messages">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Ask me questions about your policy and I will help you
                understand it better.
              </div>
            ) : (
              messages.map((msg: UIMessage, i: number) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {msg.content as string}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} /> {/* Auto-scroll anchor */}
          </div>

          {/* Chat Input */}
          <form
            className="flex gap-2 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            <Input
              name="prompt"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="flex-1"
              placeholder="Type your question..."
            />
            <Button type="submit">Send</Button>
          </form>

          <DialogFooter className="sm:justify-start">
            <div className="text-xs text-muted-foreground">
              Your policy details are used to provide personalized assistance.
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Comparison Modal */}
      <Dialog open={openCompareModal} onOpenChange={setOpenCompareModal}>
        <DialogContent className="sm:max-w-md md:max-w-xl lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compare with other {policy.type} policies</DialogTitle>
          </DialogHeader>

          <div className="flex items-center border rounded-md px-3 py-2 mb-4">
            <IconSearch className="h-4 w-4 mr-2 opacity-50" />
            <Input
              placeholder="Search policies by name or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {filteredPolicies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {policy.type} policies found for comparison
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPolicies.map((comparePolicy) => (
                  <Card
                    key={comparePolicy._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigateToComparison(comparePolicy._id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{comparePolicy.name}</h3>
                        <p className="text-sm text-gray-500">
                          {comparePolicy.provider || "Unknown Provider"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {comparePolicy.premium || "Price not specified"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Sum Insured: ₹
                          {comparePolicy.sumInsured || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenCompareModal(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
