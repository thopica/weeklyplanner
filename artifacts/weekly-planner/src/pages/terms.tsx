import { LegalArticle } from "@/components/LegalArticle";

export default function TermsPage() {
  return (
    <LegalArticle title="Terms of use">
      <p>
        This planner is provided as a convenience tool. You are responsible for how you use it,
        for backing up any data you care about, and for complying with laws that apply to you.
      </p>
      <p>
        The software is offered without warranties of any kind. To the extent permitted by law,
        we are not liable for lost data, missed appointments, or decisions you make based on what you
        write here.
      </p>
      <p>
        Swap this text for terms that match your entity, jurisdiction, and how you ship the product.
      </p>
    </LegalArticle>
  );
}
