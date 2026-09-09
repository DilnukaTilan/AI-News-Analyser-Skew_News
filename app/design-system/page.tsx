import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { BiasMeter } from "@/components/ui/bias-meter";
import { ArticleCard } from "@/components/ui/article-card";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-bg-primary p-6 shadow-sm">
      <h2 className="text-h4 mb-5 uppercase tracking-wide text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({
  name,
  hex,
  ring = false,
}: {
  name: string;
  hex: string;
  ring?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-16 w-full rounded-md shadow-sm"
        style={{
          background: hex,
          boxShadow: ring ? "inset 0 0 0 1px #E5E7EB" : undefined,
        }}
      />
      <span className="text-caption font-medium uppercase text-text-secondary">
        {name}
      </span>
      <span className="text-caption text-text-secondary">{hex}</span>
    </div>
  );
}

const TYPE_SCALE = [
  {
    cls: "text-h1",
    name: "H1",
    use: "Page / Screen Title",
    meta: "32px · Bold · 1.2",
  },
  {
    cls: "text-h2",
    name: "H2",
    use: "Section Title",
    meta: "24px · SemiBold · 1.3",
  },
  {
    cls: "text-h3",
    name: "H3",
    use: "Card / Module Title",
    meta: "20px · SemiBold · 1.3",
  },
  {
    cls: "text-h4",
    name: "H4",
    use: "Subheading",
    meta: "16px · Medium · 1.4",
  },
  {
    cls: "text-body-lg",
    name: "Body Large",
    use: "Important content",
    meta: "16px · Regular · 1.6",
  },
  {
    cls: "text-body-md",
    name: "Body Medium",
    use: "Body text",
    meta: "14px · Regular · 1.6",
  },
  {
    cls: "text-body-sm",
    name: "Body Small",
    use: "Supporting text",
    meta: "13px · Regular · 1.6",
  },
  {
    cls: "text-caption",
    name: "Caption",
    use: "Labels, meta text",
    meta: "11px · Regular · 1.4",
  },
];

const SPACING = [4, 8, 16, 24, 32, 40, 64];

const SHADOWS = [
  { name: "Small", cls: "shadow-sm", spec: "0 1px 2px rgba(0,0,0,0.05)" },
  { name: "Medium", cls: "shadow-md", spec: "0 4px 12px rgba(0,0,0,0.08)" },
  { name: "Large", cls: "shadow-lg", spec: "0 12px 24px rgba(0,0,0,0.12)" },
];

const RADII = [
  { name: "Small", cls: "rounded-sm", spec: "4px" },
  { name: "Medium", cls: "rounded-md", spec: "8px" },
  { name: "Large", cls: "rounded-lg", spec: "12px" },
  { name: "Full", cls: "rounded-full", spec: "9999px" },
];

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        {/* Brand */}
        <Section title="Brand">
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="flex items-baseline gap-2">
              <span className="text-h1 font-bold">Skew</span>
              <span className="text-h4 text-text-secondary">News</span>
            </div>
            <p className="text-body-md text-text-secondary">
              Balanced news coverage, powered by AI.
            </p>
          </div>
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-caption mb-3 font-semibold uppercase text-text-secondary">
                Brand
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Swatch name="Text Primary" hex="#0D0D0F" />
                <Swatch name="Text Secondary" hex="#6B7280" />
                <Swatch name="Surface" hex="#F6F6F6" ring />
              </div>
            </div>
            <div>
              <p className="text-caption mb-3 font-semibold uppercase text-text-secondary">
                Semantic
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Swatch name="Left Bias" hex="#B42318" />
                <Swatch name="Center" hex="#E5E7EB" ring />
                <Swatch name="Right Bias" hex="#1D4ED8" />
              </div>
            </div>
            <div>
              <p className="text-caption mb-3 font-semibold uppercase text-text-secondary">
                Neutrals
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Swatch name="BG Primary" hex="#FFFFFF" ring />
                <Swatch name="BG Secondary" hex="#F0F0F0" ring />
                <Swatch name="Border" hex="#E5E7EB" ring />
                <Swatch name="Divider" hex="#E5E7EB" ring />
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <p className="text-body-md mb-6 text-text-secondary">
            Font family:{" "}
            <span className="font-semibold text-text-primary">Poppins</span> — a
            modern geometric sans-serif that ensures clarity and excellent
            readability.
          </p>
          <div className="flex flex-col divide-y divide-divider">
            {TYPE_SCALE.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className={`${t.cls} text-text-primary`}>{t.name}</span>
                <div className="flex flex-col text-right sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="text-body-sm text-text-secondary">
                    {t.use}
                  </span>
                  <span className="text-caption text-text-secondary sm:w-40 sm:text-right">
                    {t.meta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* UI Elements */}
        <Section title="UI Elements">
          <div className="flex flex-col gap-8">
            {/* Buttons */}
            <div>
              <p className="text-caption mb-4 font-semibold uppercase text-text-secondary">
                Buttons
              </p>
              <div className="flex flex-col gap-4">
                {(["primary", "secondary", "outline", "text"] as const).map(
                  (v) => (
                    <div key={v} className="flex flex-wrap items-center gap-4">
                      <span className="text-body-sm w-24 text-text-secondary capitalize">
                        {v}
                      </span>
                      <Button variant={v}>Button</Button>
                      <Button variant={v} disabled>
                        Disabled
                      </Button>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Chips */}
            <div>
              <p className="text-caption mb-4 font-semibold uppercase text-text-secondary">
                Chip / Category
              </p>
              <div className="flex flex-wrap gap-3">
                <Chip label="World Cup" addable />
                <Chip label="IPL" addable />
                <Chip label="Business & Markets" addable />
                <Chip label="More" addable />
              </div>
            </div>

            {/* Bias meter */}
            <div>
              <p className="text-caption mb-4 font-semibold uppercase text-text-secondary">
                Bias Meter
              </p>
              <BiasMeter
                left={25}
                center={50}
                right={25}
                showScale
                className="max-w-lg"
              />
            </div>
          </div>
        </Section>

        {/* Card example */}
        <Section title="Card Example">
          <ArticleCard
            category="Politics"
            country="United States"
            title="Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report"
            excerpt="The proposal includes stricter limits on uranium enrichment and enhanced verification measures."
            timeAgo="2h ago"
            readTime="12 min read"
            bias={{ left: 25, center: 26, right: 49 }}
            className="max-w-2xl"
          />
        </Section>

        {/* Spacing */}
        <Section title="Spacing System (4px base unit)">
          <div className="flex flex-wrap items-end gap-4">
            {SPACING.map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div className="bg-accent/20" style={{ width: s, height: s }} />
                <span className="text-caption text-text-secondary">{s}px</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows + Radius */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Section title="Shadows">
            <div className="flex flex-col gap-5">
              {SHADOWS.map((sh) => (
                <div key={sh.name} className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-md bg-bg-primary ${sh.cls}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-body-sm font-medium text-text-primary">
                      {sh.name}
                    </span>
                    <span className="text-caption text-text-secondary">
                      {sh.spec}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Border Radius">
            <div className="flex flex-col gap-5">
              {RADII.map((r) => (
                <div key={r.name} className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 border-2 border-text-primary bg-bg-primary ${r.cls}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-body-sm font-medium text-text-primary">
                      {r.name}
                    </span>
                    <span className="text-caption text-text-secondary">
                      {r.spec}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
