"use client";

import { MAX_STATUS_LENGTH, charLength } from "@/lib/statuses/validator-500";
import { cn } from "@/lib/utils";

/**
 * ThreadsPreview (UI-Spec 3.2 kolom kanan / section 4): read-only, real-time
 * from form state. Always dark background (UI-Spec section 6).
 */
export function ThreadsPreview({
  statuses,
  akun = "draft.kamu",
  linkProduk,
  letakLink = "balasan",
}: {
  statuses: string[];
  akun?: string;
  linkProduk?: string;
  letakLink?: "status_terakhir" | "balasan" | "tanpa_link";
}) {
  const showLinkOnLast =
    letakLink === "status_terakhir" && linkProduk ? linkProduk : undefined;
  const showReply =
    letakLink === "balasan" && linkProduk ? linkProduk : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-[#2f2f2f] bg-[#101010] text-[#e7e5e4]">
      <div className="flex items-center justify-between border-b border-[#2f2f2f] px-4 py-2">
        <span className="text-xs font-medium text-[#a8a2a0]">Preview Threads</span>
        <span className="text-[10px] uppercase tracking-wide text-[#78716c]">Selalu latar gelap</span>
      </div>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-4">
        {statuses.length === 0 ? (
          <p className="text-sm text-[#78716c]">Belum ada status untuk dipreview.</p>
        ) : null}

        {statuses.map((status, index) => {
          const length = charLength(status);
          const over = length > MAX_STATUS_LENGTH;
          const isLast = index === statuses.length - 1;
          const text = isLast && showLinkOnLast ? `${status}\n${showLinkOnLast}` : status;

          return (
            <article key={index} className="flex gap-3">
              {/* Avatar */}
              <div
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-xs font-bold text-white"
              >
                {akun.slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 text-sm">
                  <span className="font-semibold">{akun}</span>
                  <span className="text-xs text-[#78716c]">· sekarang</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6">{text}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#78716c]">
                  <span
                    className={cn("tabular-nums", over && "font-semibold text-red-400")}
                  >
                    {length}/{MAX_STATUS_LENGTH}
                  </span>
                  <span>♡</span>
                  <span>💬</span>
                  <span>↻</span>
                </div>
              </div>
            </article>
          );
        })}

        {showReply ? (
          <article className="flex gap-3 border-t border-[#2f2f2f] pt-4">
            <div
              aria-hidden
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-xs font-bold text-white"
            >
              {akun.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="font-semibold">{akun}</span>
                <span className="text-xs text-[#78716c]">· balasan</span>
              </div>
              <p className="mt-0.5 break-words text-sm leading-6 text-orange-400">{showReply}</p>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
