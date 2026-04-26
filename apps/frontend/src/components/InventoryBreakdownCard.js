// apps/frontend/src/components/InventoryBreakdownCard.js

import Image from "next/image";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import SellIcon from "@mui/icons-material/Sell";
import RecyclingIcon from "@mui/icons-material/Recycling";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

export default function InventoryBreakdownCard({ items = [], isAdmin }) {
  if (!items.length) return null;

  const schoolStock = items
    .filter((r) => r.itemStatus === "GeneralOffice" && r.storedAt === "School")
    .reduce((s, r) => s + (r.quantity || 0), 0);
  const psgActivities = items
    .filter((r) => r.itemStatus === "ForSale" && r.storedAt === "School")
    .reduce((s, r) => s + (r.quantity || 0), 0);
  const forRepurposing = items
    .filter((r) => r.itemStatus === "ForRepurpose" && r.storedAt === "TCC")
    .reduce((s, r) => s + (r.quantity || 0), 0);
  const recyclingDisposal  = items
    .filter((r) => r.itemStatus === "Disposed" && r.storedAt === "Exited")
    .reduce((s, r) => s + (r.quantity || 0), 0);
  const total = isAdmin
    ? schoolStock + psgActivities + forRepurposing + recyclingDisposal 
    : schoolStock + psgActivities;

    const buckets = [
    {
        label: "Total Pieces Collected",
        value: total,
        highlight: true,
        // icon: Inventory2OutlinedIcon,
        bg: "#dbeafe",
        color: "#1d4ed8",
    },
    {
        label: "School Stock",
        value: schoolStock,
        icon: VolunteerActivismIcon,
        bg: "#dcfce7",
        color: "#15803d",
    },
    {
        label: "PSG Activities",
        value: psgActivities,
        icon: SellIcon,
        bg: "#fef3c7",
        color: "#b45309",
    },
    ...(isAdmin
        ? [
            {
            label: "For Repurposing",
            value: forRepurposing,
            imageSrc: "/images/Logo-Symbol-green-stem.png",
            },
            {
            label: "For Recycling/Disposal",
            value: recyclingDisposal,
            icon: RecyclingIcon,
            bg: "#e8f5e9",
            color: "#2e7d32",
            },
        ]
        : []),
    ];

    return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-3"} gap-4 mb-6`}>
        {buckets.map(({ label, value, highlight, icon: Icon, bg, color, imageSrc }) => (
        <div
            key={label}
            className={`rounded-xl border shadow-sm p-4 ${
            highlight
                ? "bg-[var(--color-main)]/5 border-[var(--color-main)]/20"
                : "bg-white border-gray-100"
            }`}
        >
            <div className="flex items-start gap-3">
            {(Icon || imageSrc) && (
                <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: bg || "#ccfbf1" }}
                >
                {imageSrc ? (
                    <Image src={imageSrc} alt={label} width={28} height={28} className="object-contain" />
                ) : (
                    <Icon sx={{ fontSize: 20, color: color }} />
                )}
                </div>
            )}
            <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${highlight ? "text-[var(--color-main)]" : "text-gray-900"}`}>
                {value}
                </p>
            </div>
            </div>
        </div>
        ))}
    </div>
    );
}