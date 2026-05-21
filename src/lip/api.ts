export const getProjects = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`, {
    next: { revalidate: 3600 }, // প্রতি ১ ঘণ্টায় আপডেট হবে (SEO Friendly)
  });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
};
