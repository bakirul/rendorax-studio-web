import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://kachnamedia.com", // আপনার মূল ডোমেইন
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    // ভবিষ্যতে যদি about বা contact পেজ আসে, তবে সেগুলো এখানে যোগ করতে হবে
    // {
    //   url: 'https://kachnamedia.com/about',
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
  ];
}
