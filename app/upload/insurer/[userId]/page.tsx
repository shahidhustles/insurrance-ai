"use client";

import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/upload-file";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { use, useState } from "react";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getOcrPolicyFeatures } from "@/actions/getOcrPolicyFeatures";

const UploadPage = ({ params }: { params: Promise<{ userId: string }> }) => {
  const resolvedParams = use(params);
  const { userId } = resolvedParams;
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState<string>("");
  const [policyType, setPolicyType] = useState<"health" | "auto" | "home">(
    "health"
  );
  const [premium, setPremium] = useState<string>("");
  const [years, setYears] = useState<string>("1");
  const [sumInsured, setSumInsured] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const addPolicy = useMutation(api.insurers.addPolicy);
  const getUploadUrl = useMutation(api.users.generateUploadUrl);
  const { user } = useUser();
  const router = useRouter();
  const insurer = useQuery(api.insurers.getByUserId, {
    userId: user?.id || "",
  });

  if (!insurer) {
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

    setFiles(uploadedFiles);
    setError(null);
  };

  const handleSubmit = async () => {
    if (
      !files.length ||
      !name.trim() ||
      !premium.trim() ||
      !sumInsured.trim()
    ) {
      setError("Please fill in all required fields");
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

      // Use OCR to extract features from the policy document
      const policyFeatures = await getOcrPolicyFeatures(storageId);

      if (!policyFeatures) {
        throw new Error("Failed to extract policy features");
      }

      // Add the policy with information provided by insurer + features from OCR
      // This will update both the insurer's policy list and the separate policies table
      await addPolicy({
        insurerId: insurer._id,
        policy: {
          name: name,
          storageId: storageId,
          type: policyType,
          premium: premium,
          years: years,
          sumInsured: sumInsured,
          features: policyFeatures.features || [],
        },
      });

      // Show success state
      setSuccess(true);

      // Reset form
      setName("");
      setPolicyType("health");
      setPremium("");
      setYears("1");
      setSumInsured("");
      setFiles([]);
    } catch (err) {
      console.error(err);
      setError("Failed to upload policy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push(`/dashboard/insurer/${userId}`);
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
            Your policy has been processed and added to your portfolio. You can
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
              Upload your insurance policy document. We will extract the policy
              features automatically. Please provide the other required details
              below.
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
                placeholder="Enter the name of this policy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="max-w-md"
              />
            </div>

            <div>
              <Label
                htmlFor="policyType"
                className="block text-sm font-medium mb-1"
              >
                Policy Type
              </Label>
              <Select
                value={policyType}
                onValueChange={(value: "health" | "auto" | "home") =>
                  setPolicyType(value)
                }
                disabled={loading}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">Health Insurance</SelectItem>
                  <SelectItem value="auto">Auto Insurance</SelectItem>
                  <SelectItem value="home">Home Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="premium"
                className="block text-sm font-medium mb-1"
              >
                Premium
              </Label>
              <Input
                id="premium"
                placeholder="e.g. ₹10,000 per year"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                disabled={loading}
                className="max-w-md"
              />
            </div>

            <div>
              <Label htmlFor="years" className="block text-sm font-medium mb-1">
                Coverage Period
              </Label>
              <Select
                value={years}
                onValueChange={(value) => setYears(value)}
                disabled={loading}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select coverage period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 year</SelectItem>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="10">10 years</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="sumInsured"
                className="block text-sm font-medium mb-1"
              >
                Sum Insured
              </Label>
              <Input
                id="sumInsured"
                placeholder="e.g. ₹5,00,000"
                value={sumInsured}
                onChange={(e) => setSumInsured(e.target.value)}
                disabled={loading}
                className="max-w-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Policy Document
              </label>
              <FileUpload onChange={handleFileUpload} disabled={loading} />

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
                disabled={
                  loading ||
                  !files.length ||
                  !name.trim() ||
                  !premium.trim() ||
                  !sumInsured.trim()
                }
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
                  We are extracting policy features and analyzing the document.
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
