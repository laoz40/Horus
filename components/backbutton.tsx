import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const title = "Back Button";

const BackButton = () => (
  <Button className="gap-2" variant="secondary">
    <ArrowLeft className="size-4" />
    Back
  </Button>
);

export default BackButton;
