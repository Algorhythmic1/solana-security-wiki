import { Link } from "react-router-dom";
import { videoResources } from "../data/videoResources";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeZone: "UTC",
});

function formatPostedAt(isoDate: string) {
  return dateFmt.format(new Date(`${isoDate}T12:00:00.000Z`));
}

export function VideosPage() {
  return (
    <article className="article">
      <p className="muted">
        <Link to="/">← Timeline</Link>
      </p>
      <h1>Video resources</h1>
      <p className="muted">
        Talks, guides, and courses focused on Solana security and auditing.
        Ordered by publication date (newest first). Opens on YouTube.
      </p>

      <ul className="video-resource-list">
        {videoResources.map((item) => (
          <li key={item.url}>
            <a
              className="video-resource-card"
              href={item.url}
              target="_blank"
              rel="noreferrer"
            >
              <div className="video-resource-thumb-wrap">
                <img
                  className="video-resource-thumb"
                  src={item.thumbnailUrl}
                  alt=""
                  width={480}
                  height={360}
                  loading="lazy"
                  decoding="async"
                />
                <span className="video-resource-kind">
                  {item.kind === "playlist" ? "Playlist" : "Video"}
                </span>
              </div>
              <div className="video-resource-body">
                <h2 className="video-resource-title">{item.title}</h2>
                <p className="video-resource-meta">
                  <span>{item.channelName}</span>
                  <span aria-hidden="true"> · </span>
                  <time dateTime={item.postedAt}>
                    {formatPostedAt(item.postedAt)}
                  </time>
                </p>
                <p className="video-resource-desc">{item.description}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
