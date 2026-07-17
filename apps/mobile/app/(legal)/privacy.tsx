import { LegalDocument } from "@/src/components/LegalDocument";
import { PRIVACY_POLICY } from "@/src/constants/legal";

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocument
      title={PRIVACY_POLICY.title}
      updated={PRIVACY_POLICY.updated}
      sections={PRIVACY_POLICY.sections}
    />
  );
}
