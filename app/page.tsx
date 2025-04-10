"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()
  return (
    <div className="">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 px-4 md:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Smart Insurance,<br />Powered by AI</h1>
          <p className="text-xl mb-6">Let our artificial intelligence simplify your insurance experience. Personalized coverage recommendations, quick claims processing, and 24/7 assistance.</p>
          <button  onClick={() =>router.push("/profile") } className="bg-white text-blue-700 font-semibold py-3 px-8 rounded-lg hover:bg-blue-50 transition-all">
            Get Started
          </button>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/insurance-ai-hero.png"
            alt="AI Insurance Assistant"
            width={600}
            height={500}
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
    </div>
  );
}
