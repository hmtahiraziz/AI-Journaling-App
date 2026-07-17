import { LegalDocument } from "@/src/components/LegalDocument";
import { TERMS_OF_SERVICE } from "@/src/constants/legal";

export default function TermsOfServiceScreen() {
  return (
    <LegalDocument
      title={TERMS_OF_SERVICE.title}
      updated={TERMS_OF_SERVICE.updated}
      sections={TERMS_OF_SERVICE.sections}
    />
  );
}
