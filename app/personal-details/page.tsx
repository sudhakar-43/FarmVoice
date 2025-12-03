"use client";

import Onboarding from "@/components/Onboarding";
import { useRouter } from "next/navigation";

export default function PersonalDetailsPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push("/crop-selection");
  };

  return <Onboarding onComplete={handleComplete} />;
}
