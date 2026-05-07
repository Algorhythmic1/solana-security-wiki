/** Curated Solana security learning videos & playlists. postedAt = YouTube upload date (playlist = first video in series). */
export type VideoResourceKind = "video" | "playlist";

export interface VideoResource {
  kind: VideoResourceKind;
  url: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  /** ISO calendar date (YYYY-MM-DD) for sorting / display */
  postedAt: string;
  description: string;
}

const items: VideoResource[] = [
  {
    kind: "playlist",
    url: "https://www.youtube.com/playlist?list=PLzUrW5H8-hDdU-pzHjZrgupi5Wis6zWNJ",
    title: "Solana Auditors Bootcamp 2024",
    thumbnailUrl: "https://i.ytimg.com/vi/yYWqKRz82Pw/hqdefault.jpg",
    channelName: "Ackee Blockchain Security",
    postedAt: "2024-08-14",
    description:
      "Structured bootcamp playlist on auditing Solana programs—Anchor, tooling, and hands-on exercises from Ackee.",
  },
  {
    kind: "video",
    url: "https://www.youtube.com/watch?v=xd6qfY-GDYY",
    title:
      "How to become a Solana Security Researcher with Zigtur, Turbine and Cantina",
    thumbnailUrl: "https://i.ytimg.com/vi/xd6qfY-GDYY/hqdefault.jpg",
    channelName: "Cantina",
    postedAt: "2025-03-20",
    description:
      "Panel-style conversation on breaking into Solana security research with practicing auditors and platform folks.",
  },
  {
    kind: "video",
    url: "https://www.youtube.com/watch?v=AKn_OCYW9Ns",
    title: "How to Become a Solana Auditor: Step-by-Step Guide",
    thumbnailUrl: "https://i.ytimg.com/vi/AKn_OCYW9Ns/hqdefault.jpg",
    channelName: "rxyz",
    postedAt: "2025-06-18",
    description:
      "A practical roadmap: skills, learning order, and how to build proof-of-work that hiring teams care about.",
  },
  {
    kind: "video",
    url: "https://www.youtube.com/watch?v=Gy1mvpJwiVQ",
    title: "Solana: The Bugs You're Missing | DeFi Security Summit 2025",
    thumbnailUrl: "https://i.ytimg.com/vi/Gy1mvpJwiVQ/hqdefault.jpg",
    channelName: "DeFi Security Summit",
    postedAt: "2025-11-23",
    description:
      "Conference talk on vulnerability classes that often slip past reviews—useful for auditors and protocol teams.",
  },
  {
    kind: "video",
    url: "https://www.youtube.com/watch?v=dpzSjHGU53I",
    title: "Flashloan Hacking Challenge [Solana Tutorial] - Apr 22nd '26",
    thumbnailUrl: "https://i.ytimg.com/vi/dpzSjHGU53I/hqdefault.jpg",
    channelName: "Solandy [solandy.sol]",
    postedAt: "2026-04-27",
    description:
      "Walkthrough of a Solana flash-loan style challenge—good for sharpening exploit scripting and program assumptions.",
  },
];

export const videoResources = [...items].sort(
  (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
);
