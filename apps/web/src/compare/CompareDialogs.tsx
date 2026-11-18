import { lazy, Suspense } from "react";
import { CapacityDecision } from "../components/CapacityDecision";
import { SupportDialog } from "../components/SupportDialog";
import { useStore } from "../store";
const AboutModal = lazy(() =>
  import("../components/AboutModal").then((module) => ({
    default: module.AboutModal,
  })),
);
const DocumentHistoryModal = lazy(() =>
  import("../components/DocumentHistoryModal").then((module) => ({
    default: module.DocumentHistoryModal,
  })),
);
export function CompareDialogs() {
  const about = useStore((state) => state.isAboutModalOpen);
  const history = useStore((state) => state.isHistoryModalOpen);
  return (
    <>
      <CapacityDecision />
      <SupportDialog />
      <Suspense fallback={null}>
        {about && <AboutModal />}
        {history && (
          <DocumentHistoryModal
            isOpen={history}
            onClose={() => useStore.getState().setIsHistoryModalOpen(false)}
          />
        )}
      </Suspense>
    </>
  );
}
