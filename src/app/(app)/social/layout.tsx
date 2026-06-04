import { SocialTabs } from "@/components/social/social-tabs";

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Flux</h2>
        <p className="text-sm text-muted-foreground">
          Les contenus partagés par la communauté.
        </p>
      </div>
      <SocialTabs />
      {children}
    </div>
  );
}
