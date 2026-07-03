import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*", // এর মানে সব সার্চ ইঞ্জিন বট (Google, Bing ইত্যাদি) সাইট ভিজিট করতে পারবে
      allow: "/", // সব পেজ স্ক্যান করার অনুমতি দেওয়া হলো
      disallow: "/private-reel", // Protected reel route — exclude from search indexing
    },
    sitemap: "https://rendorax.com/sitemap.xml", // সাইটম্যাপের লিংক গুগলকে জানিয়ে দেওয়া
  };
}
