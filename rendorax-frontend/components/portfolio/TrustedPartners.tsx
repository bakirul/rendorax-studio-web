import Image from "next/image";

type Partner =
  | { name: string; type: "image"; src: string; width: number; height: number }
  | { name: string; type: "wordmark"; label: string };

const trustedPartners: Partner[] = [
  {
    name: "World Bank",
    type: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/87/The_World_Bank_logo.svg",
    width: 160,
    height: 40,
  },
  {
    name: "International Labour Organization",
    type: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/9/9a/International_Labour_Organization_logo.svg",
    width: 140,
    height: 48,
  },
  {
    name: "International Organization for Migration",
    type: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/0/0f/IOM_logo.svg",
    width: 120,
    height: 48,
  },
  {
    name: "UNDP",
    type: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/b/bc/UNDP_logo.svg",
    width: 72,
    height: 72,
  },
  {
    name: "UNICEF",
    type: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/e/ed/UNICEF_Logo.svg",
    width: 120,
    height: 48,
  },
  {
    name: "UKaid",
    type: "wordmark",
    label: "UKaid",
  },
  {
    name: "Swiss Agency for Development and Cooperation",
    type: "wordmark",
    label: "SDC",
  },
  {
    name: "DANIDA",
    type: "wordmark",
    label: "DANIDA",
  },
  {
    name: "Swisscontact",
    type: "wordmark",
    label: "Swisscontact",
  },
  {
    name: "World Health Organization",
    type: "image",
    src: "https://upload.wikimedia.org/wikipedia/commons/c/c2/WHO_logo.svg",
    width: 56,
    height: 56,
  },
];

export default function TrustedPartners() {
  return (
    <section className="w-full border-t border-white/5 bg-black/30 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold-primary block mb-3">
            Global Development Network
          </span>
          <h2 className="text-2xl md:text-3xl font-display text-white leading-tight">
            Trusted Partners
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {trustedPartners.map((partner) => (
            <div
              key={partner.name}
              className="group flex items-center justify-center h-20 md:h-24 rounded-xl border border-white/5 bg-white/[0.02] px-4 transition-colors duration-300 hover:border-white/15 hover:bg-white/[0.04]"
            >
              <div className="opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0">
                {partner.type === "image" ? (
                  <Image
                    src={partner.src}
                    alt={`${partner.name} logo`}
                    width={partner.width}
                    height={partner.height}
                    className="max-h-10 md:max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.18em] text-white/70 group-hover:text-white transition-colors">
                    {partner.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 md:mt-10 text-center text-xs md:text-sm text-text-gray font-light leading-relaxed max-w-2xl mx-auto">
          Executing projects for over 50+ global development organizations and
          multi-donor initiatives.
        </p>
      </div>
    </section>
  );
}
