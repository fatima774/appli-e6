const sampleLogements = [
  {
    id_logement: 1,
    titre: "Studio lumineux près de la fac",
    ville: "Lyon",
    type: "Studio",
    prix: 420,
    image: "https://images.unsplash.com/photo-1560184897-ea7f7a9a9f5a?auto=format&fit=crop&w=1200&q=60",
    description: "Petit studio meublé avec balcon, quartier calme et proche des transports.",
    date_ajout: "2025-11-01T09:00:00Z",
    avis: [
      { auteur: "Camille", note: 5, commentaire: "Propre et très bien situé.", date: "2025-11-05" },
      { auteur: "Lucas", note: 4, commentaire: "Cuisine petite mais fonctionnelle.", date: "2025-11-10" },
    ],
  },
  {
    id_logement: 2,
    titre: "T2 moderne, lumineux",
    ville: "Paris",
    type: "T2",
    prix: 780,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=60",
    description: "Grand T2, proche du métro, parfait pour colocation ou couple.",
    date_ajout: "2025-10-20T12:00:00Z",
    avis: [
      { auteur: "Amina", note: 5, commentaire: "Excellent rapport qualité/prix.", date: "2025-10-22" },
      { auteur: "Youssef", note: 3, commentaire: "Quartier parfois bruyant la nuit.", date: "2025-10-28" },
    ],
  },
  {
    id_logement: 3,
    titre: "Chambre étudiante cosy",
    ville: "Rennes",
    type: "Chambre",
    prix: 300,
    image: "https://images.unsplash.com/photo-1505692794403-22da5b2d6f53?auto=format&fit=crop&w=1200&q=60",
    description: "Chambre dans résidence étudiante, services inclus, ambiance conviviale.",
    date_ajout: "2025-09-15T08:30:00Z",
    avis: [
      { auteur: "Sofia", note: 4, commentaire: "Ambiance sympa et équipements propres.", date: "2025-09-20" },
    ],
  },
  {
    id_logement: 4,
    titre: "Colocation centrale",
    ville: "Lille",
    type: "Colocation",
    prix: 450,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=60",
    description: "Grande maison partagée, chambres spacieuses, bonne ambiance.",
    date_ajout: "2025-08-05T11:00:00Z",
    avis: [
      { auteur: "Marta", note: 5, commentaire: "Coloc sympa et bien tenue.", date: "2025-08-10" },
    ],
  },
];

export default sampleLogements;
