/**
 * Parser metadata OpenGraph dan meta HTML standar dari string HTML.
 * Mengutamakan og:title, og:description, og:image, lalu fallback ke <title> dan meta description.
 */

export interface MetaHasil {
  title: string;
  description: string;
  image?: string;
}

export function ekstrakMetaHTML(html: string): MetaHasil {
  if (!html || typeof html !== "string") {
    return { title: "", description: "" };
  }

  // 1. Title: og:title -> <title>
  let title = "";
  const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    title = ogTitleMatch[1].trim();
  } else {
    const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleTagMatch && titleTagMatch[1]) {
      title = titleTagMatch[1].trim();
    }
  }

  // 2. Description: og:description -> meta name="description"
  let description = "";
  const ogDescMatch = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
  if (ogDescMatch && ogDescMatch[1]) {
    description = ogDescMatch[1].trim();
  } else {
    const metaDescMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    if (metaDescMatch && metaDescMatch[1]) {
      description = metaDescMatch[1].trim();
    }
  }

  // 3. Image: og:image
  let image: string | undefined = undefined;
  const ogImageMatch = html.match(/<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    image = ogImageMatch[1].trim();
  }

  // Unescape basic HTML entities like &amp;, &quot;, &#39;, &lt;, &gt;
  const unescapeHTML = (str: string) =>
    str
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

  return {
    title: unescapeHTML(title),
    description: unescapeHTML(description),
    image,
  };
}
