"use client";

import { getOcrPolicy } from "@/actions/getOcrPolicy";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/upload-file";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { use, useState } from "react";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const UploadPage = ({ params }: { params: Promise<{ userId: string }> }) => {
  const resolvedParams = use(params);
  const { userId } = resolvedParams;
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const addPolicy = useMutation(api.customers.addPastPolicy);
  const getUploadUrl = useMutation(api.users.generateUploadUrl);
  const { user } = useUser();
  const router = useRouter();
  const customer = useQuery(api.customers.getByUserId, {
    userId: user?.id || "",
  });

  if (!customer) {
    return (
      <div className="w-full max-w-4xl mx-auto min-h-96 flex items-center justify-center">
        <p>Loading your profile...</p>
      </div>
    );
  }

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (!uploadedFiles.length) {
      setError("Please select a file to upload");
      return;
    }

    setFiles(uploadedFiles); // Store the files in state
    setError(null);
  };

  const handleSubmit = async () => {
    if (!files.length || !name.trim()) {
      setError("Please provide both a policy name and file");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const file = files[0]!;
      const postUrl = await getUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();
      const policyInfo = await getOcrPolicy(storageId);

      if (!policyInfo) {
        throw new Error("Failed to extract policy information");
      }

      // Ensure all required fields are present with defaults if needed
      await addPolicy({
        customerId: customer._id,
        policy: {
          name,
          storageId,
          type: policyInfo.type || "health",
          provider: policyInfo.provider || "Unknown Provider",
          sumInsured: policyInfo.sumInsured || "Not specified",
          premium: policyInfo.premium || "Not specified",
          expiryDate: policyInfo.expiryDate || "Not specified",
          features: policyInfo.features || [],
        },
      });

      // Show success state
      setSuccess(true);

      // Reset form
      setName("");
      setFiles([]);
    } catch (err) {
      console.error(err);
      setError("Failed to upload policy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push(`/dashboard/${userId}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      {success ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <IconCheck className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-medium">Policy uploaded successfully!</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md">
            Your policy has been processed and added to your account. You can
            view it on your dashboard.
          </p>
          <Button onClick={handleGoToDashboard} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded flex items-center gap-2 mb-4">
              <IconAlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-medium mb-4">
              Upload Insurance Policy
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Upload your insurance policy document for analysis. We support
              PDF, JPG and PNG formats.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="policyName"
                className="block text-sm font-medium mb-1"
              >
                Policy Name
              </label>
              <Input
                id="policyName"
                placeholder="Enter a name for this policy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="max-w-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Policy Document
              </label>
              <FileUpload onChange={handleFileUpload} disabled={loading} />

              {/* Display selected file information if available */}
              {files.length > 0 && !loading && (
                <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Selected file:{" "}
                  <span className="font-medium">{files[0]?.name}</span>
                  <span className="ml-2">
                    ({(files[0]?.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            <div>
              <Button
                onClick={handleSubmit}
                disabled={loading || !files.length || !name.trim()}
              >
                {loading ? "Processing..." : "Submit Policy"}
              </Button>
            </div>

            {loading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4 text-center">
                <p className="text-blue-600 dark:text-blue-400">
                  Processing your policy document. This may take a moment...
                </p>
                <p className="text-sm text-blue-500 dark:text-blue-300 mt-2">
                  We&apos;re extracting information like coverage amount,
                  premium, and benefits.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UploadPage;
