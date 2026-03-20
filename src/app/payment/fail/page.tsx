import { Suspense } from "react";
import { PaymentFailContent } from "./_content";

export const dynamic = "force-dynamic";

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-8">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <div className="w-10 h-10 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <PaymentFailContent />
        </Suspense>
      </div>
    </div>
  );
}
