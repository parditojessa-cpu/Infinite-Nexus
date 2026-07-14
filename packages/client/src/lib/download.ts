import { useAuthStore } from "./authStore";

export async function downloadAuthedFile(path: string, filename?: string) {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(path, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  if (filename) a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
