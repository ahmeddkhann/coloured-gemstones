"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HistoryPoint = {
  id: string;
  gemstoneId: string;
  gemstoneName: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
};

type StoneOption = {
  id: string;
  name: string;
};

const COLORS = [
  "#0F3D2E",
  "#B8860B",
  "#1A1612",
  "#8B4513",
  "#2F4F4F",
  "#556B2F",
];

export function PriceHistoryChart({ stones }: { stones: StoneOption[] }) {
  const [selected, setSelected] = useState<string[]>(
    stones.slice(0, 3).map((stone) => stone.id),
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPending(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (selected.length > 0) {
          params.set("gemstoneIds", selected.join(","));
        }
        if (from) {
          params.set("from", from);
        }
        if (to) {
          params.set("to", `${to}T23:59:59.999Z`);
        }
        const response = await fetch(
          `/api/admin/price-history?${params.toString()}`,
        );
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          data?: HistoryPoint[];
        };
        if (cancelled) {
          return;
        }
        if (!payload.ok) {
          setError(payload.error ?? "Could not load price history.");
          setPoints([]);
          return;
        }
        setPoints(payload.data ?? []);
      } catch {
        if (!cancelled) {
          setError("Could not load price history.");
          setPoints([]);
        }
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [selected, from, to]);

  const seriesIds = useMemo(() => {
    const ids = selected.length
      ? selected
      : [...new Set(points.map((point) => point.gemstoneId))];
    return ids;
  }, [selected, points]);

  const nameById = useMemo(() => {
    const map = new Map(stones.map((stone) => [stone.id, stone.name]));
    for (const point of points) {
      map.set(point.gemstoneId, point.gemstoneName);
    }
    return map;
  }, [stones, points]);

  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>();

    for (const point of points) {
      const key = new Date(point.changedAt).toISOString().slice(0, 10);
      const row = byDate.get(key) ?? { date: key };
      row[point.gemstoneId] = point.newPrice;
      byDate.set(key, row);
    }

    return [...byDate.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [points]);

  function toggleStone(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm text-[var(--admin-muted)]">
          From
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm text-[var(--admin-muted)]">
          To
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
      </div>

      <div>
        <p className="text-sm text-[var(--admin-muted)]">Products</p>
        <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
          {stones.map((stone) => {
            const active = selected.includes(stone.id);
            return (
              <button
                key={stone.id}
                type="button"
                onClick={() => toggleStone(stone.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-jewel bg-jewel text-white"
                    : "border-[var(--admin-border)] bg-white text-[var(--admin-ink)] hover:bg-black/[0.03]"
                }`}
              >
                {stone.name}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {pending ? (
        <p className="text-sm text-[var(--admin-muted)]">Loading chart…</p>
      ) : null}

      <div className="h-80 w-full rounded-2xl border border-[var(--admin-border)] bg-white p-4">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[var(--admin-muted)]">
            No price changes in this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d4" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {seriesIds.map((id, index) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={nameById.get(id) ?? id}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
