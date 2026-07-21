import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

// photos import
import ciara_photo from '../pictures/ciara_raudsepp.png';
import james_photo from '../pictures/james_page.png';
import katherine_photo from '../pictures/katherine_hebert.jpg';
import maho_photo from '../pictures/maho_horikawa.jpg';
import peter_photo from '../pictures/peter_soroye.png';
import ryan_photo from '../pictures/ryan_hull.png';
import qbiodiversity_lab_logo from '../pictures/qbiodiversity_lab.png';
import guillaume_photo from '../pictures/guillaume_larocque.png';
import joseph_photo from '../pictures/joe_bowden.png';
import noah_photo from '../pictures/noah_wightman.png';
import laura_photo from '../pictures/laura_pollock.jpg';
import wietze_photo from '../pictures/wietze_suijker.png';
import isaac_photo from '../pictures/isaac_eckert.png';
import scenic_forest_bg from '../assets/images/scenic_forest_bg_1784646535857.jpg';

// logos import
import cwf_logo from '../pictures/CWF_logo.png';
import kba_logo from '../pictures/KBA_logo.png';
import ldp_logo from '../pictures/LDP_logo.png';
import mila_logo from '../pictures/MILA_logo.png';
import natcan_logo from '../pictures/NatResourcesCAN_logo.png';
import qcbs_logo from '../pictures/QCBS_logo.png';
import wcs_logo from '../pictures/WCS_logo.png';
import inat_logo from '../pictures/inat_logo.png';
import mcgill_logo from '../pictures/mcgill_logo.png';



const TreeDecorationLeft = () => (
  <div className="absolute left-[-220px] bottom-10 w-[170px] h-[550px] pointer-events-none opacity-10 hidden xl:block select-none">
    <svg viewBox="0 0 100 300" className="w-full h-full text-sage-750 fill-current">
      <path d="M 50 10 L 80 70 L 65 70 L 85 130 L 70 130 L 95 210 L 55 210 L 55 250 L 45 250 L 45 210 L 5 210 L 30 130 L 15 130 L 35 70 L 20 70 Z" />
      <path d="M 25 80 L 50 130 L 40 130 L 55 180 L 45 180 L 60 250 L 20 250 L 20 280 L 15 280 L 15 250 L 0 250 L 10 180 L 0 180 L 12 130 L 5 130 Z" opacity="0.75" />
      <path d="M 75 100 L 95 140 L 87 140 L 100 190 L 90 190 L 100 260 L 65 260 L 65 285 L 60 285 L 60 260 L 50 260 L 58 190 L 50 190 L 62 140 L 55 140 Z" opacity="0.65" />
    </svg>
  </div>
);

const TreeDecorationRight = () => (
  <div className="absolute right-[-220px] bottom-10 w-[170px] h-[550px] pointer-events-none opacity-10 hidden xl:block select-none">
    <svg viewBox="0 0 100 300" className="w-full h-full text-sage-750 fill-current transform scale-x-[-1]">
      <path d="M 50 15 L 78 75 L 63 75 L 83 135 L 68 135 L 93 215 L 55 215 L 55 255 L 45 255 L 45 215 L 7 215 L 32 135 L 17 135 L 37 75 L 22 75 Z" />
      <path d="M 25 90 L 48 140 L 38 140 L 53 190 L 43 190 L 58 260 L 20 260 L 20 290 L 15 290 L 15 260 L 2 260 L 12 190 L 2 190 L 14 140 L 7 140 Z" opacity="0.8" />
      <path d="M 75 80 L 95 125 L 87 125 L 100 175 L 90 175 L 100 245 L 65 245 L 65 275 L 60 275 L 60 245 L 50 245 L 58 175 L 50 175 L 62 125 L 55 125 Z" opacity="0.55" />
    </svg>
  </div>
);

export default function AboutView() {
  const { lang } = useLanguage();

  const teamMembers = [
    { name: "Dr. Laura Pollock", role: lang === 'EN' ? "Principal Investigator" : "Chercheuse principale", tag: "LP", photo: laura_photo },
    { name: "Dr. Katherine Hébert", role: lang === 'EN' ? "Postdoctoral Researcher" : "Chercheuse postdoctorale", tag: "KH", photo: katherine_photo, scale: 1.3, objectPosition: "center 18%" },
    { name: "Noah Wightman", role: lang === 'EN' ? "Software Developer" : "Développeur de logiciels", tag: "NW", photo: noah_photo },
    { name: "Isaac Eckert", role: lang === 'EN' ? "PhD Candidate" : "Candidat au doctorat", tag: "IE", photo: isaac_photo, scale: 1.35, objectPosition: "center 22%" },
    { name: "Maho Horikawa", role: lang === 'EN' ? "Research Assistant" : "Assistant de recherche", tag: "MH", photo: maho_photo, scale: 2.2, objectPosition: "center 18%" },
    { name: "Ryan Hull", role: lang === 'EN' ? "Research Assistant" : "Assistant de recherche", tag: "RH", photo: ryan_photo, scale: 1.25, objectPosition: "center 28%", className: "saturate-[0.70] brightness-[1.03]" }
  ];

  const partnersList = [
    { name: "Ciara Raudsepp-Hearne", organization: "WCS Canada", role: lang === 'EN' ? "Director of KBAs" : "Directrice des KBA", tag: "MU", photo: ciara_photo, scale: 1.4, objectPosition: "center 25%" },
    { name: "Peter Soroye", organization: "WCS Canada", role: lang === 'EN' ? "KBA Assessment and Outreach Coordinator" : "Coordonnateur de l'évaluation et de la sensibilisation des KBA", tag: "KBA", photo: peter_photo, scale: 1.45, objectPosition: "center 32%" },
    { name: "Guillaume Larocque", organization: "QCBS, GEOBON, Biodiversité Québec", role: lang === 'EN' ? "Research Professional" : "Professionnel de recherche", tag: "WCS", photo: guillaume_photo },
    { name: "James Pagé", organization: "Canadian Wildlife Federation", role: lang === 'EN' ? "Species at Risk and Biodiversity Specialist" : "Spécialiste des espèces en péril et de la biodiversité", tag: "CWF", photo: james_photo, scale: 1.4, objectPosition: "center 32%" },
    { name: "Wietze Sujiker", organization: "MILA", role: lang === 'EN' ? "Geospatial Data Engineer" : "Ingénieur de données géospatiales", tag: "iNAT", photo: wietze_photo },
    { name: "Joseph Bowden", organization: "Natural Resources Canada", role: lang === 'EN' ? "Research Scientist" : "Chercheur scientifique", tag: "BCP", photo: joseph_photo, scale: 1.4, objectPosition: "center 22%" }
  ];

  const partnerLogos = [
    { src: mcgill_logo, alt: "McGill University", className: "h-8 sm:h-10 max-w-[120px] object-contain" },
    { src: wcs_logo, alt: "Wildlife Conservation Society Canada", className: "h-18 sm:h-22 max-w-[240px] object-contain" },
    { src: kba_logo, alt: "Key Biodiversity Areas Canada", className: "h-20 sm:h-24 max-w-[220px] object-contain" },
    { src: cwf_logo, alt: "Canadian Wildlife Federation", className: "h-15 sm:h-17 max-w-[200px] object-contain" },
    { src: mila_logo, alt: "Mila AI Institute", className: "h-16 sm:h-19 max-w-[180px] object-contain" },
    { src: inat_logo, alt: "iNaturalist Canada", className: "h-16 sm:h-19 max-w-[200px] object-contain" },
    { src: ldp_logo, alt: "LDP", className: "h-18 sm:h-22 max-w-[190px] object-contain mix-blend-multiply" },
    { src: natcan_logo, alt: "Natural Resources Canada", className: "h-12 sm:h-14 max-w-[210px] object-contain" },
    { src: qcbs_logo, alt: "QCBS", className: "h-18 sm:h-22 max-w-[240px] object-contain" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-10 pt-8 px-6 sm:px-10 md:px-12 animate-fadeIn relative overflow-visible bg-sage-50/30 rounded-[2.5rem] border border-sage-100/10 shadow-3xs">
      {/* Scenic forest background with lowered opacity */}
      <div 
        className="absolute inset-0 -z-10 bg-cover bg-top rounded-[2.5rem] opacity-15 pointer-events-none" 
        style={{ backgroundImage: `url(${scenic_forest_bg})` }}
      />
      
      {/* Intro Header */}
      <section className="text-center space-y-3 py-6">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-wood-950 tracking-tight">
          {lang === 'EN' ? "About openbiodiversity.ca" : "À propos de openbiodiversity.ca"}
        </h1>
        <p className="text-base text-gray-650 max-w-2xl mx-auto leading-relaxed font-sans">
          {lang === 'EN' 
            ? "Providing transparent, reproducible spatial indices to coordinate national responses to rapid climate and human-footprint change."
            : "Fournir des indices spatiaux transparents et reproductibles pour coordonner les réponses nationales face aux changements climatiques rapides et à l'empreinte humaine."}
        </p>
      </section>

      {/* Main Philosophy & Scientific Vision */}
      <section className="bg-white rounded-2xl p-6 md:p-8 space-y-6 shadow-md shadow-gray-300">
        <div>
          <h2 className="font-display font-semibold text-xl text-wood-900">
            {lang === 'EN' ? "Vision" : "Vision"}
          </h2>
          <div className="h-[2px] bg-sage-100/60 w-16 mt-2 mb-4 rounded" />
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
            {lang === 'EN' 
              ? "We are in the era of big data, big models and big threats. Every day we understand more about the biodiversity on the planet, and every day this biodiversity becomes more threatened. We approach this challenge from quantitative macro-ecological and biogeographical perspectives, developing next-generation models and predictive indicators to ground research in ecological reality and translate findings directly into actionable conservation solutions."
              : "Nous sommes à l'ère des mégadonnées, des grands modèles et des grandes menaces. Chaque jour, nous en apprenons davantage sur la biodiversité de notre planète, et chaque jour, cette biodiversité est de plus en plus menacée. Nous abordons ce défi sous des perspectives macro-écologiques et biogéographiques quantitatives, en développant des modèles et des indicateurs prédictifs de nouvelle génération pour ancrer la recherche dans la réalité écologique et traduire les résultats directement en solutions de conservation exploitables."}
          </p>
        </div>
      </section>

      {/* Who We Are & Team Section */}
      <section className="bg-white rounded-2xl p-6 md:p-8 space-y-6 shadow-md shadow-gray-300">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="font-display font-semibold text-2xl text-wood-950">
            {lang === 'EN' ? "Who We Are" : "Qui nous sommes"}
          </h3>
        </div>

        {/* Quantitative Biodiversity Lab Logo & Edited About Text */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-sage-50/40 p-5 rounded-2xl border border-sage-100/50">
          <div className="w-20 h-20 bg-white border border-sage-200/60 rounded-2xl shadow-3xs flex items-center justify-center shrink-0 p-0 overflow-hidden">
            <img
              src={qbiodiversity_lab_logo}
              alt="Quantitative Biodiversity Lab"
              className="w-full h-full object-contain scale-[1.1] border-none outline-none select-none"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="text-center sm:text-left space-y-2">
            <h4 className="font-display font-bold text-base text-wood-950">
              {lang === 'EN' ? "Quantitative Biodiversity Lab \u2022 McGill University" : "Laboratoire de biodiversité quantitative \u2022 Université McGill"}
            </h4>
            <p className="text-xs text-gray-650 leading-relaxed font-sans">
              {lang === 'EN' 
                ? "The Quantitative Biodiversity Lab is an academic research group at McGill University dedicated to understanding global biodiversity patterns and predicting spatial responses to environmental change. We develop cutting-edge macro-ecological models, map spatial networks, analyze geographical biases, and create reproducible indicators to help guide national-scale conservation programs across Canada's unique landscapes."
                : "Le Laboratoire de biodiversité quantitative est un groupe de recherche universitaire de l'Université McGill voué à la compréhension des patrons mondiaux de biodiversité et à la prévision des réponses spatiales aux changements environnementaux. Nous développons des modèles macro-écologiques de pointe, cartographions des réseaux spatiaux, analysons les biais géographiques et créons des indicateurs reproductibles pour aider à guider les programmes de conservation à l'échelle nationale à travers les paysages uniques du Canada."}
            </p>
          </div>
        </div>

        {/* Team Members */}
        <div className="pt-2">
          <h4 className="font-display font-semibold text-sm text-wood-850 mb-6 text-center sm:text-left">
            {lang === 'EN' ? "Research and Development Team:" : "Équipe de recherche et développement :"}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {teamMembers.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center space-y-3">
                <div className="relative w-20 h-20 rounded-full bg-sage-50/70 shadow-xs flex items-center justify-center text-sage-600 overflow-hidden group hover:bg-sage-100/60 transition-all">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className={`w-full h-full object-cover transition-transform duration-300 border-none outline-none ${(member as any).className || ''}`}
                      style={{
                        objectPosition: (member as any).objectPosition || 'center',
                        transform: `scale(${(member as any).scale || 1})`,
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center select-none">
                      <span className="font-display font-bold text-sm tracking-tight text-sage-800">
                        {member.tag}
                      </span>
                      <span className="text-[8px] text-sage-455 font-medium tracking-wider font-sans uppercase mt-0.5">photo</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-0.5">
                  <h5 className="font-display font-bold text-xs text-wood-950 leading-tight">{member.name}</h5>
                  <p className="text-[10px] text-gray-400 font-medium font-sans leading-tight">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Partners Section */}
      <section className="bg-white rounded-2xl p-6 md:p-8 space-y-6 shadow-md shadow-gray-300">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="font-display font-semibold text-2xl text-wood-950">
            {lang === 'EN' ? "Our Partners" : "Nos partenaires"}
          </h3>
        </div>

        <p className="text-xs text-gray-500 w-full leading-relaxed font-sans">
          {lang === 'EN' 
            ? "Achieving nationwide coverage relies on extensive cross-sector collaboration. We are proud to partner with leading academic bodies, provincial authorities, conservation consortia, and community-science networks to integrate spatial models and map observation gaps."
            : "L'atteinte d'une couverture nationale repose sur une vaste collaboration intersectorielle. Nous sommes fiers de nous associer à des organismes universitaires de premier plan, des autorités provinciales, des consortiums de conservation et des réseaux de science communautaire pour intégrer des modèles spatiaux et cartographier les lacunes d'observation."}
        </p>

        {/* Partners Logos / Representatives */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-2">
          {partnersList.map((partner) => (
            <div key={partner.name} className="flex flex-col items-center text-center space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-gray-50/70 shadow-xs flex flex-col items-center justify-center text-gray-500 overflow-hidden group hover:bg-gray-100/60 transition-all">
                {partner.photo ? (
                  <img
                    src={partner.photo}
                    alt={partner.name}
                    className="w-full h-full object-cover transition-transform duration-300 border-none outline-none"
                    style={{
                      objectPosition: (partner as any).objectPosition || 'center',
                      transform: `scale(${(partner as any).scale || 1})`,
                    }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center select-none">
                    <span className="font-mono text-xs font-bold text-gray-455 select-none">{partner.tag}</span>
                    <span className="text-[8px] text-gray-400 font-medium tracking-wider font-sans uppercase mt-0.5">photo</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-0.5">
                <h5 className="font-display font-bold text-xs text-wood-950 leading-tight-1">{partner.name}</h5>
                <p className="text-[10px] text-sage-600 font-semibold font-sans leading-tight">{partner.organization}</p>
                <p className="text-[9px] text-gray-400 font-sans font-medium leading-tight">{partner.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Logos Seamless Puzzle Cluster */}
      <div className="w-full pt-6 pb-2 border-t border-sage-200/40">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-12 sm:gap-y-10 w-full">
          {partnerLogos.map((logo, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center transition-all duration-300 hover:scale-105 select-none"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className={`${logo.className} transition-all duration-300 filter grayscale-0 opacity-95 hover:opacity-100 border-none outline-none`}
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
