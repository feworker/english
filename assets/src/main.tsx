import { createRoot } from "react-dom/client";
import { DictationPage } from "@/pages/dictation";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "../js/dictation-i18n.js";
const root = createRoot(document.getElementById("root")!);
root.render(
  <main role="status" aria-label={t("state.loading")} className="space-y-4 p-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-32 w-full" />
  </main>,
);
requestAnimationFrame(() => root.render(<DictationPage />));
