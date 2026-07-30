import type { SequestrationSite } from "@/lib/sequestrationSites";

export function SequestrationSiteList({
  sites,
}: {
  sites: SequestrationSite[];
}) {
  if (sites.length === 0) {
    return <p>No sequestration sites yet.</p>;
  }

  return (
    <ul>
      {sites.map((site) => (
        <li key={site.id}>{site.name}</li>
      ))}
    </ul>
  );
}
