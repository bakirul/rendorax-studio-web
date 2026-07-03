import Image from "next/image";

type PartnerLogoEntry = {
  name: string;
  src: string;
  alt: string;
};

const AIMS_LOGO: PartnerLogoEntry = {
  name: "AIMS Bangladesh",
  src: "/assets/aimsbangladesh%20Logo.png",
  alt: "AIMS Bangladesh Logo - Professional Track Record and Media Production Partner",
};

const partnerLogos: PartnerLogoEntry[] = [
  {
    name: "World Bank",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/87/The_World_Bank_logo.svg",
    alt: "World Bank Logo - Global Development Partner Portfolio",
  },
  {
    name: "International Labour Organization",
    src: "/assets/ilo-logo.png",
    alt: "International Labour Organization (ILO) Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "ActionAid",
    src: "/assets/actionaid-logo.jpeg",
    alt: "ActionAid Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "Government of Bangladesh",
    src: "/assets/bangladesh-logo.jpeg",
    alt: "Government of Bangladesh Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "BCAS",
    src: "/assets/bcas-logo.jpeg",
    alt: "Bangladesh Centre for Advanced Studies (BCAS) Logo - Professional Track Record",
  },
  {
    name: "ICCO",
    src: "/assets/icco-logo.png",
    alt: "ICCO Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "IFC",
    src: "/assets/ifc-logo.png",
    alt: "International Finance Corporation (IFC) Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "Save the Children",
    src: "/assets/save-the-children-logo.jpeg",
    alt: "Save the Children Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "Swisscontact",
    src: "/assets/swisscontact-logo.png",
    alt: "Swisscontact Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "The Nansen Initiative",
    src: "/assets/thenanseninitiative-logo.jpeg",
    alt: "The Nansen Initiative Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "International Organization for Migration",
    src: "/assets/un-iom-logo-.png",
    alt: "International Organization for Migration (IOM) Logo - Post Production Partner",
  },
  {
    name: "UNDP",
    src: "/assets/undp-logo.png",
    alt: "United Nations Development Programme (UNDP) Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "UNFPA",
    src: "/assets/unfpa-logo.png",
    alt: "United Nations Population Fund (UNFPA) Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "UN Women",
    src: "/assets/unwomen-logo.jpeg",
    alt: "UN Women Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "WaterAid Bangladesh",
    src: "/assets/wateraidbangladesh-logo.jpeg",
    alt: "WaterAid Bangladesh Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "World Vision",
    src: "/assets/worldvision-logo.png",
    alt: "World Vision Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "Plan International",
    src: "/assets/plan-logo.jpeg",
    alt: "Plan International Logo - Professional Track Record and Media Production Partner",
  },
  {
    name: "KATALYST",
    src: "/assets/katalyst-logo.jpeg",
    alt: "KATALYST Logo - Professional Track Record and Media Production Partner",
  },
];

function PartnerLogo({
  alt,
  src,
  heightClass = "h-16 md:h-20",
}: {
  alt: string;
  src: string;
  heightClass?: string;
}) {
  return (
    <div
      className={`group flex w-full items-center justify-center ${heightClass} px-2`}
    >
      <Image
        src={src}
        alt={alt}
        width={160}
        height={80}
        className="max-h-full w-auto max-w-full object-contain opacity-60 grayscale transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:grayscale-0 mix-blend-luminosity group-hover:mix-blend-normal"
      />
    </div>
  );
}

export default function ProfessionalTrackRecord() {
  return (
    <section className="w-full border-t border-white/5 bg-zinc-950 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display text-white leading-tight mb-4">
            Professional Track Record
          </h2>
          <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed">
            Showcasing high-impact media production and post-production projects
            delivered during my tenure at AIMS Bangladesh (2010-2016) for
            leading global development agencies.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:p-10">
          <div className="mb-10 flex flex-col items-center gap-3 border-b border-white/10 pb-8 md:mb-12 md:pb-10">
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold-primary/80">
              Primary Agency
            </span>
            <PartnerLogo
              alt={AIMS_LOGO.alt}
              src={AIMS_LOGO.src}
              heightClass="h-20 md:h-24"
            />
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 text-center mb-8">
            Partner Organizations
          </p>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {partnerLogos.map((partner) => (
              <PartnerLogo
                key={partner.name}
                alt={partner.alt}
                src={partner.src}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
