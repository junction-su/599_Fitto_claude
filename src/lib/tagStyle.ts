export function getTagStyle(tag: string): { background: string; color: string } {
  switch (tag) {
    case "Breathing": return { background: "rgba(99,149,210,0.14)",  color: "#4A7BB5" };
    case "Walk":      return { background: "rgba(111,125,90,0.14)",  color: "#6F7D5A" };
    case "Stretch":   return { background: "rgba(198,130,70,0.14)",  color: "#A06828" };
    case "Mobility":  return { background: "rgba(198,120,80,0.13)",  color: "#A06030" };
    case "Posture":   return { background: "rgba(140,110,175,0.13)", color: "#7B5E9A" };
    case "Core":      return { background: "rgba(185,90,90,0.13)",   color: "#9B4545" };
    default:          return { background: "rgba(111,125,90,0.12)",  color: "#6F7D5A" };
  }
}
