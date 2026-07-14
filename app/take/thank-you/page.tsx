import { CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function ThankYouPage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="px-6 py-6 flex items-center justify-center">
        <Logo variant="full" height={24} />
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full surface-card p-8 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-[var(--md-success-container)] flex items-center justify-center text-[var(--md-success)]">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="text-xl font-bold text-[var(--md-on-surface)]">Thank you</h1>
          <p className="text-[var(--md-on-surface-variant)] text-sm leading-relaxed">
            Your responses have been submitted successfully. The hiring team will review your
            assessment and follow up with next steps.
          </p>
        </div>
      </div>
    </main>
  );
}
