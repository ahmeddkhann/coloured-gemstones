/** Inject Cloudinary delivery transforms without touching the API secret. */
export function withCloudinaryTransforms(
  url: string,
  transforms = "f_auto,q_auto",
) {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  // Avoid double-injecting when a transform string is already present.
  if (/\/upload\/(?:[^/]+,)+[^/]+\//.test(url)) {
    return url;
  }

  return url.replace("/upload/", `/upload/${transforms}/`);
}

export function cardImageUrl(url: string) {
  return withCloudinaryTransforms(url, "f_auto,q_auto,c_fill,w_800");
}

export function detailImageUrl(url: string) {
  return withCloudinaryTransforms(url, "f_auto,q_auto,c_limit,w_1400");
}
