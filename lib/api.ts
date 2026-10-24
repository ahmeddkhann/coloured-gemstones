import { ZodError } from "zod";

export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function jsonError(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export function zodError(error: ZodError) {
  return jsonError(error.issues[0]?.message ?? "Invalid request", 400);
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function handleRouteError(error: unknown) {
  console.error(error);
  return jsonError("Something went wrong.", 500);
}
