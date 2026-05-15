import { LegalArticle } from "@/components/LegalArticle";

export default function PrivacyPage() {
  return (
    <LegalArticle title="Privacy">
      <p>
        This weekly planner stores your entries, themes, and schedule preferences in your browser
        only (typically in <strong className="text-foreground">localStorage</strong>). Nothing is
        sent to our servers because this app does not include a hosted account or sync service.
      </p>
      <p>
        If you use export or import, files you save or choose stay on your device unless you upload
        them somewhere else yourself.
      </p>
      <p>
        Replace this page with your own policy before distributing the app widely. A lawyer can help
        you describe analytics, cookies, subprocessors, retention, and regional requirements.
      </p>
    </LegalArticle>
  );
}
