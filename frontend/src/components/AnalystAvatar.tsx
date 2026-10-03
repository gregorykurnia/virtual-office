import { useEffect, useState, type CSSProperties } from "react";
import type { AgentId } from "@investment-office/shared";
import { AVATAR_ASSETS, OFFICE_ASSETS, type AvatarPose } from "../assets/officeAssets";

export type AnalystAvatarContext = "scene" | "portrait";

export default function AnalystAvatar({
  agentId,
  pose,
  context,
  className = "",
  eager = false
}: {
  agentId: AgentId;
  pose: AvatarPose;
  context: AnalystAvatarContext;
  className?: string;
  eager?: boolean;
}) {
  const asset = AVATAR_ASSETS[agentId][pose];
  const initial = OFFICE_ASSETS[agentId].accessibleName.charAt(0);
  const [format, setFormat] = useState<"webp" | "png">(asset.webp ? "webp" : "png");
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setFormat(asset.webp ? "webp" : "png");
    setHasFailed(false);
    setIsLoading(true);
  }, [asset.webp, asset.png]);

  function handleImageError() {
    setIsLoading(false);
    if (format === "webp" && asset.webp) {
      setFormat("png");
      return;
    }

    setHasFailed(true);
  }

  const source = format === "webp" && asset.webp ? asset.webp : asset.png;
  const avatarStyle = {
    "--avatar-art-offset-y": `${(0.859375 - asset.groundAnchorY) * 100}%`
  } as CSSProperties;
  const classes = [
    "analyst-avatar",
    `analyst-avatar--${context}`,
    `analyst-avatar--${agentId}`,
    isLoading ? "analyst-avatar--loading" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <span className={classes} style={avatarStyle} aria-hidden="true">
      {context === "scene" ? <span className="analyst-avatar__shadow" /> : null}
      {context === "scene" ? <span className="analyst-avatar__selection-ring" /> : null}
      <span className="analyst-avatar__loading" />
      {hasFailed ? (
        <span className="analyst-avatar__fallback">{initial}</span>
      ) : (
        <picture className="analyst-avatar__picture">
          {format === "webp" && asset.webp ? <source srcSet={asset.webp} type="image/webp" /> : null}
          <img
            className="analyst-avatar__image"
            src={source}
            alt=""
            width={352}
            height={352}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setIsLoading(false)}
            onError={handleImageError}
          />
        </picture>
      )}
    </span>
  );
}
