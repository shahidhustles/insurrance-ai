import {
  getAllPolicies,
  getCustomerInfo,
  google,
  ocrPolicyDocument,
} from "@/actions/recommendationTools";
import { generateText, tool } from "ai";
import { log } from "console";
import { z } from "zod";

export async function POST(req: Request) {
  console.log("POST request received at /api/insurance-agent");

  const { userId } = await req.json();
  console.log(`Processing request for userId: ${userId}`);

  console.log(`Fetching customer info for userId: ${userId}`);
  const customerInfo = await getCustomerInfo(userId);
  console.log("Customer info retrieved successfully");

  console.log("Fetching all available policies");
  const policies = await getAllPolicies();
  console.log(`Fetched ${policies ? policies.length || 0 : 0} policies`);

  console.log("Setting up system prompt with customer info and policies");
  const systemPrompt = `
      You are an expert insurance advisor AI. Your task is to analyze a customer's profile and recommend the most suitable 
      insurance policies from the available options. Your recommendations must be personalized to the customer's needs, 
      risk profile, and existing coverage.
  
     
      
      INSTRUCTIONS:
      1. Analyze the customer's profile including age, occupation, income range, location, risk appetite, and existing policies
      2. Evaluate the available policies and their details (type, coverage, premium, features)
      3. Consider gaps in the customer's current coverage
      4. Use the moreInfoAboutPolicy tool to gather additional details about specific policies when needed
      5. Recommend EXACTLY 3 most suitable policies from the available options
      6. Ensure recommendations are diverse to cover different insurance needs
      7. Focus on policies that offer good value based on the customer's risk profile
      
      For each policy that looks promising, use the moreInfoAboutPolicy tool to get additional details by providing:
      - The storageId of the policy document
      - A specific question about the policy that would help determine if it's suitable for this customer
      
      YOUR RESPONSE MUST BE IN THIS JSON FORMAT:
      {
        "recommendations": [
          {
            "policyId": "[policy _id from the database] which are in this format : jd79bzc2qxth81w8tfcqxx0e3h7dtfs0 or jd730nj80swbhqnvaqtzfavfdh7dtw48",
            "confidenceScore": [0-100],
            "summary": "[brief one-line summary]",
            "reasons": ["reason1", "reason2", "reason3"],
            "benefitsForCustomer": ["benefit1", "benefit2"]
          },
          ...
        ]
      }
      
      IMPORTANT: You MUST return exactly 3 policy recommendations in order of relevance, using the EXACT policy _id from the database.
      If there aren't enough suitable policies, recommend the best available options anyway.
      `;

  console.log("Setting up moreInfoAboutPolicy tool");
  const moreInfoTool = tool({
    description: "get more info about a policy",
    parameters: z.object({
      storageId: z
        .string()
        .describe(
          "Id of the storage present in the object of that policy in storageId field"
        ),
      prompt: z
        .string()
        .describe("What specific info do you want from teh document?"),
    }),
    execute: async ({ storageId, prompt }) => {
      console.log(
        `Tool execution: Getting more info about policy with storageId: ${storageId}`
      );
      console.log(`Prompt for document analysis: ${prompt}`);
      try {
        const result = await ocrPolicyDocument(storageId, prompt);
        console.log("OCR policy document analysis completed");
        return result;
      } catch (error: unknown) {
        console.error(
          `Error in OCR policy tool: ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
      }
    },
  });

  const { text } = await generateText({
    model: google("gemini-1.5-flash"),
    prompt: "say hii",
  });
  log(text);
  console.log("Generating policy recommendations using AI");
  const { text: rawResponse } = await generateText({
    model: google("gemini-1.5-pro-latest"),
    system: systemPrompt,
    maxSteps: 10,
    prompt: `Please provide insurance recommendations for this customer. Here's the detailed customer information:
          
${JSON.stringify(customerInfo, null, 2)}

Available policies:
${JSON.stringify(policies, null, 2)}
`,

    tools: {
      moreInfoAboutPolicy: moreInfoTool,
    },
  });
  
  console.log("AI response received successfully");
  console.log(`Raw response type: ${typeof rawResponse}`);
  console.log(`Raw response length: ${rawResponse.length}`);
  
  // Clean up the response - remove markdown code block syntax if present
  let cleanedResponse = rawResponse;
  if (rawResponse.includes("```json")) {
    cleanedResponse = rawResponse.replace(/```json\s*/, "").replace(/\s*```\s*$/, "");
  }
  
  try {
    // Parse the JSON to validate it
    const jsonResponse = JSON.parse(cleanedResponse);
    console.log("Successfully parsed JSON response");
    
    // Return the cleaned JSON response
    return new Response(JSON.stringify(jsonResponse), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    console.log("Raw response content:", rawResponse);
    
    // Return the raw response if parsing fails
    return new Response(rawResponse);
  }
}
