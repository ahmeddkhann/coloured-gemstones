export function serializeDoc<T extends { toObject?: () => unknown }>(doc: T) {
  const raw = (typeof doc.toObject === "function" ? doc.toObject() : doc) as Record<
    string,
    unknown
  > & { _id?: { toString(): string } };

  const { _id, __v, ...rest } = raw;
  return {
    id: _id?.toString?.() ?? String(_id),
    ...rest,
  };
}
