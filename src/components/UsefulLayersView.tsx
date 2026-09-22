import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

export default function UsefulLayersView() {
  const { lang } = useLanguage();

  return (
    <div className="space-y-8 pb-16">

      {/* Intro Header */}
      <section className="bg-white rounded-2xl p-6 md:p-8 shadow-md shadow-gray-300">
        <h1 className="font-display font-semibold text-2xl sm:text-3xl text-wood-900 tracking-tight">
          {lang === 'EN' ? "10 Useful Layers for Conservation in Canada" : "10 couches utiles pour la conservation au Canada"}
        </h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed font-sans">
          {lang === 'EN'
            ? "Key layers to inform conservation planning and guide land use decisions. These layers were identified with the aim of providing useful and transparent data, accessible and applicable Canada-wide. They do not stand to replace local knowledge or detailed regional datasets, but rather to provide a groundwork from which more specific assessments can take shape."
            : "Couches clés pour éclairer la planification de la conservation et guider les décisions d'utilisation du territoire. Ces couches ont été identifiées dans le but de fournir des données utiles et transparentes, accessibles et applicables à l'échelle du Canada. Elles ne visent pas à remplacer les connaissances locales ou les ensembles de données régionaux détaillés, mais plutôt à fournir une base à partir de laquelle des évaluations plus spécifiques peuvent prendre forme."}
        </p>
      </section>

      {/* Viewer (all content — header/footer/controls — lives inside the standalone HTML) */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-md shadow-gray-300">
        <iframe
          title="10 Useful Layers Viewer"
          src="/viewers/10-useful-layers-viewer.html"
          className="w-full border-0"
          style={{ height: '700px' }}
        />
      </div>

    </div>
  );
}
