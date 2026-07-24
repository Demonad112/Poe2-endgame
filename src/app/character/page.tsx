import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { CharacterWorkspace } from "@/components/character/CharacterWorkspace";

export const metadata: Metadata = {
  title: "Character Import — PoE2 Endgame Companion",
};

export default function CharacterPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Character Import"
        description="Paste a poe.ninja profile URL to see your character's defenses, skills, and gear. The lookup goes through a small proxy — poe.ninja blocks direct browser requests — but it only forwards public profile data and stores nothing."
      />
      <CharacterWorkspace />
    </div>
  );
}
