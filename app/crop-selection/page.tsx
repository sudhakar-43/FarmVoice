"use client";

import CropSelection from "@/components/CropSelection";
import { useRouter } from "next/navigation";

export default function CropSelectionPage() {
  const router = useRouter();

  const handleCropSelected = () => {
    router.push("/home");
  };

  return <CropSelection onCropSelected={handleCropSelected} />;
}
