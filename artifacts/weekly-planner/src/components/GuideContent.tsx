import {
  GuideDataLossItem,
  GuideList,
  GuideOrderedList,
  GuideParagraph,
  GuideSection,
  GuideStepList,
  GuideSubheading,
  GuideTable,
  GuideTip,
  GuideWarning,
} from "@/components/guide/GuideSection";

export function GuideContent() {
  return (
    <>
      <GuideSection title="Welcome" variant="emphasis">
        <GuideParagraph>
          Thank you for your purchase.
        </GuideParagraph>
        <GuideParagraph>
          This planner was made to feel <strong className="text-foreground">intuitive and easy</strong>
          —you can start planning right away without reading a long manual. It is also designed
          to be <strong className="text-foreground">beautiful</strong>, so opening it each day
          feels calm, not like work software.
        </GuideParagraph>
        <GuideParagraph>
          The sections below cover <strong className="text-foreground">Settings</strong> and the
          most important things to know about{" "}
          <strong className="text-foreground">how your data is stored</strong>, so you do not lose
          weeks of planning by accident.
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="One-minute setup">
        <GuideStepList
          steps={[
            "Double-click index.html → bookmark the page in your browser",
            "Settings → pick theme and light/dark",
            "Settings → Habits → add 1–3 habits (optional)",
            "Settings → Calendar hours (optional)",
            "Settings → Export backup → save somewhere safe",
            "Start planning on Day view",
          ]}
        />
        <GuideParagraph>
          The planner itself stays simple—this page is here to protect the planning you put into
          it.
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="Settings overview">
        <GuideSubheading>Appearance</GuideSubheading>
        <GuideList>
          <li>
            <strong className="text-foreground">Light / Dark / System</strong> — System follows
            your computer&apos;s light/dark mode.
          </li>
          <li>
            <strong className="text-foreground">Theme</strong> — Boho Neutral, Blush Rose, Matcha
            Morning, Lavender Haze, or Classic Minimalist.
          </li>
        </GuideList>
        <GuideParagraph>
          These are saved automatically. They are{" "}
          <strong className="text-foreground">not</strong> removed if you clear planner data.
        </GuideParagraph>

        <GuideSubheading>Calendar hours</GuideSubheading>
        <GuideParagraph>
          Sets the <strong className="text-foreground">start and end time</strong> for your daily
          schedule (time blocking). Default is roughly 8 AM–5 PM.
        </GuideParagraph>
        <GuideParagraph>
          If you <strong className="text-foreground">clear planner data</strong>, your custom
          hours are reset—you will set them again.
        </GuideParagraph>

        <GuideSubheading>Habits</GuideSubheading>
        <GuideParagraph>Create the habits you want to track each day (up to 12).</GuideParagraph>
        <GuideTable
          headers={["Type", "Use for", "Example"]}
          rows={[
            [
              <strong key="yes" className="text-foreground">
                Yes / No
              </strong>,
              "Done or not done",
              "Vitamins, stretch",
            ],
            [
              <strong key="meas" className="text-foreground">
                Measurable
              </strong>,
              "A number each day",
              "Water (glasses), steps",
            ],
          ]}
        />
        <GuideList>
          <li>
            <strong className="text-foreground">Deleting a habit</strong> removes it from all past
            days—not just today.
          </li>
        </GuideList>
        <GuideParagraph>
          Until you add at least one habit, the Habits section will not show on your daily page.
        </GuideParagraph>

        <GuideSubheading>Data management</GuideSubheading>
        <GuideParagraph>This is the most important part of Settings.</GuideParagraph>
        <GuideTable
          headers={["Button", "What it does"]}
          rows={[
            [
              <strong key="export" className="text-foreground">
                Export backup
              </strong>,
              "Downloads a file with your full planner and preferences",
            ],
            [
              <strong key="import" className="text-foreground">
                Import backup
              </strong>,
              "Replaces what is in the planner now with the file you choose",
            ],
            [
              <strong key="demo" className="text-foreground">
                Load demo data
              </strong>,
              "Fills the planner with sample tasks and habits (~30 days)",
            ],
            [
              <strong key="clear" className="text-foreground">
                Clear planner data
              </strong>,
              "Deletes all days, tasks, habits, and calendar hours in this browser",
            ],
          ]}
        />
      </GuideSection>

      <GuideSection
        title="How your data is stored"
        description="Please read this—your plans stay on your computer, not in the cloud."
        variant="emphasis"
      >
        <GuideParagraph>
          Your planner does <strong className="text-foreground">not</strong> use an account or
          cloud sync.
        </GuideParagraph>
        <GuideParagraph>
          Everything is stored in your browser on <strong className="text-foreground">this computer</strong>:
        </GuideParagraph>
        <GuideList>
          <li>Tasks, focus, gratitude, brain dump</li>
          <li>Habits and habit logs</li>
          <li>Time blocks</li>
          <li>Theme and layout choices</li>
          <li>Focus timer preferences</li>
        </GuideList>
        <GuideParagraph>
          <strong className="text-foreground">Nothing is uploaded</strong> unless you export a
          backup yourself.
        </GuideParagraph>
        <GuideTip>
          Changes save automatically as you type. <strong className="text-foreground">Saved</strong> in
          the header means it worked.
        </GuideTip>
      </GuideSection>

      <GuideSection
        title="What causes data loss"
        description="Avoid these situations—most are easy to prevent with a backup."
      >
        <div className="space-y-3">
          <GuideDataLossItem number={1} title="Using different browsers">
            <GuideParagraph>
              Chrome, Edge, Firefox, and Safari each keep their own copy of your planner.
            </GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Pick one browser and always use it.
              Bookmark that page.
            </GuideTip>
          </GuideDataLossItem>

          <GuideDataLossItem number={2} title="Opening a different copy of the app">
            <GuideParagraph>
              Your data is tied to the exact index.html file you open in your browser. If you
              unzip a second copy, move the folder, or open index.html from another location, it
              can look like a blank planner.
            </GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Keep one planner folder, always
              open the same index.html, and bookmark that page.
            </GuideTip>
          </GuideDataLossItem>

          <GuideDataLossItem number={3} title="Clearing browser data">
            <GuideParagraph>
              Clearing site data or local storage can delete your planner permanently.
            </GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Export a backup before any browser
              cleanup.
            </GuideTip>
          </GuideDataLossItem>

          <GuideDataLossItem number={4} title="Private / Incognito mode">
            <GuideParagraph>
              Some browsers do not keep data after you close private windows.
            </GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Use a normal browser window for
              daily planning.
            </GuideTip>
          </GuideDataLossItem>

          <GuideDataLossItem number={5} title="Load demo data">
            <GuideParagraph>
              Overwrites your current planner with samples—it is not a backup.
            </GuideParagraph>
            <GuideWarning>
              <strong className="text-foreground">Do:</strong> Only on a fresh install, or export
              first if you have real plans.
            </GuideWarning>
          </GuideDataLossItem>

          <GuideDataLossItem number={6} title="Import backup">
            <GuideParagraph>Replaces current data with the file—not a merge.</GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Export first if unsure. Keep copies
              in cloud drive or USB.
            </GuideTip>
          </GuideDataLossItem>

          <GuideDataLossItem number={7} title="Clear planner data">
            <GuideParagraph>
              Deletes all days, tasks, habits, and calendar hours. Keeps theme, timer, and layout
              preferences.
            </GuideParagraph>
            <GuideWarning>
              <strong className="text-foreground">Do:</strong> Only for a true fresh start. Export
              first.
            </GuideWarning>
          </GuideDataLossItem>

          <GuideDataLossItem number={8} title="Deleting the planner folder">
            <GuideParagraph>
              Your plans live in the browser, not in the folder—but you need the folder to open the
              app.
            </GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Keep the folder. Back up your export
              file separately.
            </GuideTip>
          </GuideDataLossItem>

          <GuideDataLossItem number={9} title="New computer or reinstall">
            <GuideParagraph>Local storage does not travel with the download by itself.</GuideParagraph>
            <GuideTip>
              <strong className="text-foreground">Do:</strong> Export on old computer → copy file →
              Import on new computer.
            </GuideTip>
          </GuideDataLossItem>
        </div>
      </GuideSection>

      <GuideSection title="Export and import">
        <GuideSubheading>Export backup (do this regularly)</GuideSubheading>
        <GuideOrderedList>
          <li>Settings → Export backup</li>
          <li>A dated file downloads to your computer</li>
          <li>Store it somewhere safe</li>
        </GuideOrderedList>
        <GuideTip>
          Export does not change or delete anything. Safe anytime. Good habit: weekly or monthly.
        </GuideTip>

        <GuideSubheading>Import backup</GuideSubheading>
        <GuideOrderedList>
          <li>Settings → Import backup</li>
          <li>Choose a file you exported before</li>
          <li>Planner reloads with that data</li>
        </GuideOrderedList>
        <GuideWarning>Current data is replaced by the file. Export before experimenting.</GuideWarning>

        <GuideSubheading>Load demo data</GuideSubheading>
        <GuideOrderedList>
          <li>Settings → Load demo data</li>
          <li>Sample habits and ~30 days of tasks appear</li>
        </GuideOrderedList>
        <GuideParagraph>
          Use to preview Insights. Do not use on a planner you care about unless you exported first.
        </GuideParagraph>
      </GuideSection>

      <GuideSection title="If storage is full">
        <GuideParagraph>
          Rarely, the browser runs out of space and saving fails.
        </GuideParagraph>
        <GuideTip>
          Export immediately. Clear planner data only if starting fresh, then import your backup if
          needed.
        </GuideTip>
      </GuideSection>

      <GuideSection title="Quick do / don't">
        <GuideTable
          headers={["Do", "Don't"]}
          rows={[
            ["Use one browser always", "Switch browsers for the same planner"],
            ["Bookmark your index.html page", "Open index.html from a different folder copy"],
            ["Export backup regularly", "Assume re-download restores tasks"],
            ["Import only to restore", "Import over real data without exporting"],
            ["Keep the planner folder", "Clear browser site data without backup"],
            ["Use normal browser windows", "Load demo data on a full planner"],
          ]}
        />
      </GuideSection>
    </>
  );
}
