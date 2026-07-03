export const getProjects = async () => {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const res = await fetch(`${backendUrl}/api/projects`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
};
