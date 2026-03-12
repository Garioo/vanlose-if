import type { Metadata } from "next";

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
};

type ArticleMetadataOptions = MetadataOptions & {
  publishedTime?: string;
};

const DEFAULT_DEV_SITE_URL = "http://localhost:3000";

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_SITE_URL;
  }

  return null;
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${path}`;
}

function buildImage(image?: string | null): string | undefined {
  if (!image) {
    return undefined;
  }
  return toAbsoluteUrl(image);
}

export function buildPageMetadata(options: MetadataOptions): Metadata {
  const canonical = toAbsoluteUrl(options.path);
  const image = buildImage(options.image);

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: "da_DK",
      siteName: "Vanløse IF",
      title: options.title,
      description: options.description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: image ? [image] : undefined,
    },
  };
}

export function buildArticleMetadata(options: ArticleMetadataOptions): Metadata {
  const base = buildPageMetadata(options);

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: options.publishedTime,
    },
  };
}
